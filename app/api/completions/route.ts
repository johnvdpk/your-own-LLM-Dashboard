// Next.js imports
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openRouter, getOpenRouterHeaders } from '@/lib/openrouter';
import {
  generateMcpToolsSystemPrompt,
  parseToolCalls,
  executeToolCalls,
} from '@/lib/mcp-helpers';
import { validateCompletionRequest } from '@/lib/validators';
import { transformMessagesForGemini, isGeminiModel } from '@/lib/gemini-transformer';
import { detectImagesInResponse } from '@/lib/image-detector';
import {
  getContentAsString,
  getContentAsMultimodal,
  combineContentWithImages,
} from '@/lib/content-helpers';

// Type imports
import type { ChatMessage } from '@/lib/openrouter';
import type { CompletionRequest, CompletionResponse, ApiErrorResponse } from '@/types/api';

/**
 * Get comments for a chat and format them as context
 * @param chatId - Chat ID
 * @returns Formatted comments context string
 */
async function getCommentsContext(chatId: string): Promise<string> {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        message: {
          chatId,
        },
      },
      include: {
        message: {
          select: {
            role: true,
            content: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (comments.length === 0) {
      return '';
    }

    const commentsText = comments.map((comment) => {
      const messageContent = typeof comment.message.content === 'string'
        ? comment.message.content
        : Array.isArray(comment.message.content)
          ? comment.message.content
              .filter((item) => item.type === 'text')
              .map((item) => (item as { type: 'text'; text?: string }).text || '')
              .join('\n')
          : String(comment.message.content);

      const selectedText = comment.selectedText;
      const userComment = comment.userComment;
      const aiResponse = comment.aiResponse;

      let commentText = `\n--- Notitie/Vraag op tekst: "${selectedText}" ---\n`;
      commentText += `Gebruiker: ${userComment}\n`;
      
      if (aiResponse) {
        commentText += `AI antwoord: ${aiResponse}\n`;
      } else {
        commentText += `(Notitie - geen AI antwoord)\n`;
      }
      
      commentText += `--- Einde notitie/vraag ---\n`;

      return commentText;
    }).join('\n');

    return `\n\nBELANGRIJK: De gebruiker heeft notities en vragen gemaakt over specifieke delen van eerdere berichten. Neem deze mee in je overweging:\n${commentsText}\n`;
  } catch (error) {
    console.error('Error fetching comments context:', error);
    return '';
  }
}

/**
 * Add MCP tools system prompt to messages if available
 * @param messages - Array of chat messages
 * @returns Enhanced messages with MCP system prompt
 */
async function enhanceMessagesWithMcp(messages: ChatMessage[]): Promise<ChatMessage[]> {
  let mcpSystemPrompt = '';
  try {
    mcpSystemPrompt = await generateMcpToolsSystemPrompt();
  } catch (error) {
    console.error('Error generating MCP system prompt:', error);
    // Continue without MCP tools if there's an error
  }

  if (!mcpSystemPrompt) {
    return messages;
  }

  const enhancedMessages: ChatMessage[] = [...messages];

  // Check if there's already a system message
  const hasSystemMessage = enhancedMessages.some((msg) => msg.role === 'system');

  if (hasSystemMessage) {
    // Append to existing system message
    const systemIndex = enhancedMessages.findIndex((msg) => msg.role === 'system');
    const existingContent = enhancedMessages[systemIndex].content;
    // Ensure system message content is a string
    const existingText = typeof existingContent === 'string'
      ? existingContent
      : Array.isArray(existingContent) && existingContent[0]?.type === 'text'
        ? existingContent[0].text || ''
        : '';
    enhancedMessages[systemIndex] = {
      role: 'system',
      content: existingText + mcpSystemPrompt,
    };
  } else {
    // Add new system message at the beginning
    enhancedMessages.unshift({
      role: 'system',
      content: 'Je bent een behulpzame AI assistent.' + mcpSystemPrompt,
    });
  }

  return enhancedMessages;
}

/**
 * Build request body for OpenRouter API
 * @param model - Model identifier
 * @param messages - Transformed messages
 * @returns Request body object
 */
function buildRequestBody(model: string, messages: ChatMessage[]): Record<string, unknown> {
  const isGeminiImageModel = model.includes('gemini') && model.includes('image');

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    stream: false,
  };

  // Add modalities for Gemini image generation models
  if (isGeminiImageModel) {
    requestBody.modalities = ['image', 'text'];
    requestBody.extra_body = {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: '16:9',
        imageSize: '2K',
      },
    };
    console.log('Added modalities: ["image", "text"] for Gemini image generation');
  }

  return requestBody;
}

/**
 * Handle tool calls in assistant response
 * @param assistantContent - Assistant message content
 * @param enhancedMessages - Enhanced messages array
 * @param model - Model identifier
 * @returns Final assistant content after tool calls
 */
async function handleToolCalls(
  assistantContent: string,
  enhancedMessages: ChatMessage[],
  model: string
): Promise<string> {
  const toolCalls = parseToolCalls(assistantContent);

  if (toolCalls.length === 0) {
    return assistantContent;
  }

  console.log('Found tool calls:', toolCalls);

  // Execute tool calls
  const toolResults = await executeToolCalls(toolCalls);

  // Build tool results message
  const toolResultsText = toolResults
    .map((result, index) => {
      const toolCall = toolCalls[index];
      if (result.success) {
        return `Tool ${toolCall.serverName}.${toolCall.toolName} uitgevoerd: ${result.result}`;
      } else {
        return `Tool ${toolCall.serverName}.${toolCall.toolName} gefaald: ${result.error || 'Unknown error'}`;
      }
    })
    .join('\n');

  // Remove tool calls from assistant content
  const cleanedContent = assistantContent.replace(/TOOL_CALL:.*?(\n|$)/g, '').trim();

  // Send tool results back to LLM for final response
  const toolResultsMessage: ChatMessage = {
    role: 'user',
    content: `Tool resultaten:\n${toolResultsText}\n\nGeef een samenvatting van wat er is uitgevoerd.`,
  };

  const finalMessages: ChatMessage[] = [
    ...enhancedMessages,
    {
      role: 'assistant',
      content: cleanedContent,
    },
    toolResultsMessage,
  ];

  console.log('Sending tool results back to LLM for final response');

  const finalCompletion = await openRouter.chat.send(
    {
      model: model || 'openai/gpt-4o',
      messages: finalMessages,
      stream: false,
    },
    {
      headers: getOpenRouterHeaders(),
    }
  );

  if (finalCompletion?.choices?.[0]?.message) {
    return getContentAsString(finalCompletion.choices[0].message.content);
  }

  return cleanedContent;
}

/**
 * Save messages to database
 * @param chatId - Chat ID
 * @param userId - User ID
 * @param messages - Original messages array
 * @param assistantContent - Final assistant content
 */
async function saveMessagesToDatabase(
  chatId: string,
  userId: string,
  messages: CompletionRequest['messages'],
  assistantContent: unknown
): Promise<void> {
  try {
    // Verify chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId,
      },
    });

    if (!chat) {
      return;
    }

    // Get the last user message (the one just sent)
    const lastUserMessage = messages[messages.length - 1];

    // Save user message if it's not already saved
    if (lastUserMessage && lastUserMessage.role === 'user') {
      await prisma.message.create({
        data: {
          chatId,
          role: 'user',
          content: lastUserMessage.content as never,
        },
      });

      // Update chat title if it's the first message
      if (!chat.title) {
        // Extract text from content for title
        const titleText = typeof lastUserMessage.content === 'string'
          ? lastUserMessage.content
          : Array.isArray(lastUserMessage.content)
            ? lastUserMessage.content.find((item: Record<string, unknown>) => item.type === 'text')?.text || ''
            : '';

        const title = titleText.length > 50
          ? titleText.substring(0, 50) + '...'
          : titleText;

        if (title) {
          await prisma.chat.update({
            where: { id: chatId },
            data: { title },
          });
        }
      }
    }

    // Save assistant response
    await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: assistantContent as never,
      },
    });
  } catch (dbError) {
    // Log error but don't fail the request
    console.error('Error saving messages to database:', dbError);
  }
}

/**
 * POST /api/completions
 * Handles chat message requests and forwards them to OpenRouter API
 * Also saves messages to database if chatId is provided
 * @returns CompletionResponse or ApiErrorResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CompletionResponse | ApiErrorResponse>> {
  try {
    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json<ApiErrorResponse>(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 },
      );
    }

    const session = await auth();
    const body = await request.json() as CompletionRequest;
    const { messages, model, chatId } = body;

    // Validate request
    const validationError = validateCompletionRequest(body);
    if (validationError) {
      return NextResponse.json<ApiErrorResponse>(
        { error: validationError },
        { status: 400 },
      );
    }

    // Get comments context if chatId is provided
    let commentsContext = '';
    if (chatId) {
      commentsContext = await getCommentsContext(chatId);
    }

    // Enhance messages with MCP tools
    let enhancedMessages = await enhanceMessagesWithMcp(messages);

    // Add comments context to system message if available
    if (commentsContext) {
      const hasSystemMessage = enhancedMessages.some((msg) => msg.role === 'system');
      
      if (hasSystemMessage) {
        const systemIndex = enhancedMessages.findIndex((msg) => msg.role === 'system');
        const existingContent = enhancedMessages[systemIndex].content;
        const existingText = typeof existingContent === 'string'
          ? existingContent
          : Array.isArray(existingContent) && existingContent[0]?.type === 'text'
            ? existingContent[0].text || ''
            : '';
        enhancedMessages[systemIndex] = {
          role: 'system',
          content: existingText + commentsContext,
        };
      } else {
        enhancedMessages.unshift({
          role: 'system',
          content: 'Je bent een behulpzame AI assistent.' + commentsContext,
        });
      }
    }

    // Transform messages for Gemini models if needed
    const selectedModel = model || 'openai/gpt-4o';
    const transformedMessages = transformMessagesForGemini(enhancedMessages, selectedModel);

    console.log('Sending request to OpenRouter:', {
      model: selectedModel,
      messageCount: transformedMessages.length,
      isGemini: isGeminiModel(selectedModel),
    });

    // Build and send request
    const requestBody = buildRequestBody(selectedModel, transformedMessages);
    const completion = await openRouter.chat.send(
      requestBody,
      {
        headers: getOpenRouterHeaders(),
      }
    );

    console.log('OpenRouter response received');

    // Check if response has the expected structure
    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Unexpected response structure:', completion);
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unexpected response structure from OpenRouter' },
        { status: 500 },
      );
    }

    let assistantMessage = completion.choices[0].message;

    // Detect images in response
    const detectedImages = detectImagesInResponse(completion);
    if (detectedImages.length > 0) {
      console.log(`Found ${detectedImages.length} generated image(s):`, detectedImages);
    }

    // Get content as string and multimodal
    const assistantContentFull = getContentAsMultimodal(
      assistantMessage.content,
      (assistantMessage as Record<string, unknown>).reasoning
    );
    let assistantContent = getContentAsString(assistantMessage.content);

    // Use reasoning if content is empty
    const reasoning = (assistantMessage as Record<string, unknown>).reasoning;
    if ((!assistantContent || assistantContent.trim() === '') && reasoning) {
      assistantContent = typeof reasoning === 'string' ? reasoning : String(reasoning);
    }

    // Combine content with detected images
    let finalAssistantContent: typeof assistantMessage.content = assistantContentFull;
    if (detectedImages.length > 0) {
      finalAssistantContent = combineContentWithImages(assistantContent, detectedImages);
      console.log('Combined content with images');
    }

    // Handle tool calls if present
    if (assistantContent) {
      const toolCallResult = await handleToolCalls(assistantContent, enhancedMessages, selectedModel);
      if (toolCallResult !== assistantContent) {
        assistantContent = toolCallResult;
        finalAssistantContent = getContentAsMultimodal(toolCallResult);
      }
    }

    // Save messages to database if chatId is provided
    if (chatId && session?.user?.id) {
      await saveMessagesToDatabase(chatId, session.user.id, messages, finalAssistantContent);
    }

    // Return response with full multimodal content
    return NextResponse.json<CompletionResponse>({
      message: {
        ...assistantMessage,
        content: finalAssistantContent,
      },
    });
  } catch (error: unknown) {
    console.error('OpenRouter API error:', error);

    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to get completion';

    return NextResponse.json<ApiErrorResponse>(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
      },
      { status: 500 },
    );
  }
}

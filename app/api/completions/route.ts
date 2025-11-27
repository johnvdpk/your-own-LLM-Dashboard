import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { openRouter, getOpenRouterHeaders, ChatMessage } from '@/lib/openrouter';

/**
 * POST /api/completions
 * Handles chat message requests and forwards them to OpenRouter API
 * Also saves messages to database if chatId is provided
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const session = await auth();
    const body = await request.json();
    const { messages, model, chatId } = body;

    // Validate request body structure
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return NextResponse.json(
          { error: 'Invalid message role. Must be "user", "assistant", or "system"' },
          { status: 400 }
        );
      }
      if (typeof msg.content !== 'string') {
        return NextResponse.json(
          { error: 'Message content must be a string' },
          { status: 400 }
        );
      }
    }

    console.log('Sending request to OpenRouter:', { model: model || 'openai/gpt-4o', messageCount: messages.length });

    const completion = await openRouter.chat.send(
      {
        model: model || 'openai/gpt-4o',
        messages: messages as ChatMessage[],
        stream: false,
      },
      {
        headers: getOpenRouterHeaders(),
      }
    );

    console.log('OpenRouter response:', JSON.stringify(completion, null, 2));

    // Check if response has the expected structure
    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Unexpected response structure:', completion);
      return NextResponse.json(
        { error: 'Unexpected response structure from OpenRouter' },
        { status: 500 }
      );
    }

    const assistantMessage = completion.choices[0].message;

    // Helper function to convert message content to string
    const getContentAsString = (content: unknown): string => {
      if (typeof content === 'string') {
        return content;
      }
      if (Array.isArray(content)) {
        // Extract text from content array items
        return content
          .map((item) => {
            if (typeof item === 'object' && item !== null) {
              if ('type' in item && item.type === 'text' && 'text' in item) {
                return typeof item.text === 'string' ? item.text : '';
              }
            }
            return '';
          })
          .filter(Boolean)
          .join(' ');
      }
      return '';
    };

    const assistantContent = getContentAsString(assistantMessage.content);

    // Save messages to database if chatId is provided and user is authenticated
    if (chatId && session?.user?.id) {
      try {
        // Verify chat belongs to user
        const chat = await prisma.chat.findFirst({
          where: {
            id: chatId,
            userId: session.user.id,
          },
        });

        if (chat) {
          // Get the last user message (the one just sent)
          const lastUserMessage = messages[messages.length - 1];
          
          // Save user message if it's not already saved
          if (lastUserMessage && lastUserMessage.role === 'user') {
            await prisma.message.create({
              data: {
                chatId,
                role: 'user',
                content: lastUserMessage.content,
              },
            });

            // Update chat title if it's the first message
            if (!chat.title) {
              const title = lastUserMessage.content.length > 50 
                ? lastUserMessage.content.substring(0, 50) + '...' 
                : lastUserMessage.content;
              await prisma.chat.update({
                where: { id: chatId },
                data: { title },
              });
            }
          }

          // Save assistant response
          await prisma.message.create({
            data: {
              chatId,
              role: 'assistant',
              content: assistantContent,
            },
          });
        }
      } catch (dbError) {
        // Log error but don't fail the request
        console.error('Error saving messages to database:', dbError);
      }
    }

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error: unknown) {
    console.error('OpenRouter API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get completion';
    
    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : {};

    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error 
          ? error.stack 
          : undefined,
      },
      { status: 500 }
    );
  }
}


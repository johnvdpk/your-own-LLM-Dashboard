// Next.js imports
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openRouter, getOpenRouterHeaders, type ChatMessage } from '@/lib/openrouter';
import { getContentAsString } from '@/lib/content-helpers';

// Type imports
import type { ApiErrorResponse } from '@/types/api';
import type { ReplyToCommentRequest, ReplyToCommentResponse } from '@/types/comment';

/**
 * POST /api/comments/[id]/reply
 * Generate AI response to a comment
 * @returns ReplyToCommentResponse or ApiErrorResponse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ReplyToCommentResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 },
      );
    }

    const { id: commentId } = await params;
    const body = await request.json() as ReplyToCommentRequest;

    // Get comment with message and chat context
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        userId: session.user.id, // Ensure user owns the comment
      },
      include: {
        message: {
          include: {
            chat: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Comment not found' },
        { status: 404 },
      );
    }

    // Get all messages from the chat for context
    const chatMessages = await prisma.message.findMany({
      where: {
        chatId: comment.message.chatId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Convert message content to string for context
    const messageContext = chatMessages
      .map((msg) => {
        const content = typeof msg.content === 'string'
          ? msg.content
          : Array.isArray(msg.content)
            ? msg.content
                .filter((item) => item.type === 'text')
                .map((item) => (item as { type: 'text'; text?: string }).text || '')
                .join('\n')
            : String(msg.content);
        return `${msg.role}: ${content}`;
      })
      .join('\n\n');

    // Build prompt for AI response
    const selectedText = comment.selectedText;
    const userComment = comment.userComment;
    const userReply = body.userReply || '';

    // Create context-aware prompt
    const systemPrompt = `Je bent een behulpzame AI assistent. Een gebruiker heeft een vraag gesteld over een specifiek stukje tekst uit een eerdere conversatie. Geef een duidelijk en beknopt antwoord op de vraag van de gebruiker.

Context van de volledige conversatie:
${messageContext}

De gebruiker heeft de volgende tekst geselecteerd:
"${selectedText}"

En heeft hierover de volgende vraag gesteld:
"${userComment}"`;

    const userPrompt = userReply 
      ? `Vervolgvraag: ${userReply}`
      : 'Geef een antwoord op de vraag van de gebruiker.';

    // Build messages for OpenRouter
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    // Get model from chat
    const model = comment.message.chat.model || 'anthropic/claude-3.5-sonnet';

    // Call OpenRouter API
    const completion = await openRouter.chat.send(
      {
        model,
        messages,
        stream: false,
      },
      {
        headers: getOpenRouterHeaders(),
      }
    );

    if (!completion?.choices?.[0]?.message) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Failed to generate AI response' },
        { status: 500 },
      );
    }

    // Extract AI response
    const aiResponse = getContentAsString(completion.choices[0].message.content);

    // Update comment with AI response
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { aiResponse },
    });

    // Convert to response format
    const commentResponse: ReplyToCommentResponse['comment'] = {
      id: updatedComment.id,
      messageId: updatedComment.messageId,
      userId: updatedComment.userId,
      selectedText: updatedComment.selectedText,
      startOffset: updatedComment.startOffset,
      endOffset: updatedComment.endOffset,
      userComment: updatedComment.userComment,
      aiResponse: updatedComment.aiResponse,
      createdAt: updatedComment.createdAt.toISOString(),
      updatedAt: updatedComment.updatedAt.toISOString(),
    };

    return NextResponse.json<ReplyToCommentResponse>({ comment: commentResponse });
  } catch (error) {
    console.error('Error generating AI reply:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to generate AI reply' },
      { status: 500 },
    );
  }
}


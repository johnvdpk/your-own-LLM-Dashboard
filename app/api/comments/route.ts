// Next.js imports
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Type imports
import type { ApiErrorResponse } from '@/types/api';
import type { 
  CommentsApiResponse, 
  CreateCommentRequest, 
  CreateCommentResponse 
} from '@/types/comment';

/**
 * GET /api/comments
 * Get all comments for a specific message
 * @returns CommentsApiResponse or ApiErrorResponse
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<CommentsApiResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'messageId parameter is required' },
        { status: 400 },
      );
    }

    // Verify message belongs to user's chat
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        chat: {
          userId: session.user.id,
        },
      },
    });

    if (!message) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Message not found' },
        { status: 404 },
      );
    }

    // Get all comments for this message
    const comments = await prisma.comment.findMany({
      where: {
        messageId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Convert to response format
    const commentResponses = comments.map((comment) => ({
      id: comment.id,
      messageId: comment.messageId,
      userId: comment.userId,
      selectedText: comment.selectedText,
      startOffset: comment.startOffset,
      endOffset: comment.endOffset,
      userComment: comment.userComment,
      aiResponse: comment.aiResponse,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    }));

    return NextResponse.json<CommentsApiResponse>({ comments: commentResponses });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/comments
 * Create a new comment on a message
 * @returns CreateCommentResponse or ApiErrorResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateCommentResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json() as CreateCommentRequest;
    const { messageId, selectedText, startOffset, endOffset, userComment, isQuestion } = body;

    // Validate required fields
    if (!messageId || !selectedText || startOffset === undefined || endOffset === undefined || !userComment) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Missing required fields: messageId, selectedText, startOffset, endOffset, userComment' },
        { status: 400 },
      );
    }

    if (typeof startOffset !== 'number' || typeof endOffset !== 'number' || startOffset < 0 || endOffset < startOffset) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Invalid offset values' },
        { status: 400 },
      );
    }

    // Verify message belongs to user's chat
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        chat: {
          userId: session.user.id,
        },
      },
    });

    if (!message) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Message not found' },
        { status: 404 },
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        messageId,
        userId: session.user.id,
        selectedText: selectedText.trim(),
        startOffset,
        endOffset,
        userComment: userComment.trim(),
      },
    });

    // Convert to response format
    const commentResponse: CreateCommentResponse['comment'] = {
      id: comment.id,
      messageId: comment.messageId,
      userId: comment.userId,
      selectedText: comment.selectedText,
      startOffset: comment.startOffset,
      endOffset: comment.endOffset,
      userComment: comment.userComment,
      aiResponse: comment.aiResponse,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    };

    return NextResponse.json<CreateCommentResponse>({ comment: commentResponse });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to create comment' },
      { status: 500 },
    );
  }
}


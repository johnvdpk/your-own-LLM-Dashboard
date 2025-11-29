// Next.js imports
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Type imports
import type { ApiErrorResponse, UpdateChatRequest, CreateChatResponse } from '@/types/api';

/**
 * DELETE /api/chats/[id]
 * Delete a single chat for the authenticated user
 * @returns Success response or ApiErrorResponse
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;

    // Verify chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Chat not found' },
        { status: 404 },
      );
    }

    // Delete chat (CASCADE will automatically delete messages)
    await prisma.chat.delete({
      where: { id: chatId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to delete chat' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chats/[id]
 * Update chat title for the authenticated user
 * @returns CreateChatResponse or ApiErrorResponse
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CreateChatResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;
    const body = await request.json() as UpdateChatRequest;
    const { title } = body;

    if (title !== null && (typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Title must be a non-empty string or null' },
        { status: 400 },
      );
    }

    // Verify chat belongs to user
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Chat not found' },
        { status: 404 },
      );
    }

    // Update chat title
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { title: title?.trim() || null },
    });

    return NextResponse.json<CreateChatResponse>({ chat: updatedChat });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to update chat' },
      { status: 500 },
    );
  }
}


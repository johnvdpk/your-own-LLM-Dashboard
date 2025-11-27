import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ChatsApiResponse, CreateChatRequest, CreateChatResponse, DeleteChatsResponse, ApiErrorResponse } from '@/types/api';

/**
 * GET /api/chats
 * Get all chats for the authenticated user
 * @returns ChatsApiResponse or ApiErrorResponse
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ChatsApiResponse | ApiErrorResponse>> {
  try {
    const session = await auth(); 

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json<ChatsApiResponse>({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats
 * Create a new chat for the authenticated user
 * @returns CreateChatResponse or ApiErrorResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateChatResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as CreateChatRequest;
    const { title, model } = body;

    const chat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        title: title || null,
        model: model || 'anthropic/claude-3.5-sonnet',
      },
    });

    return NextResponse.json<CreateChatResponse>({ chat }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chats
 * Delete all chats for the authenticated user
 * @returns DeleteChatsResponse or ApiErrorResponse
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<DeleteChatsResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all chats for the user (CASCADE will automatically delete messages)
    const result = await prisma.chat.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json<DeleteChatsResponse>({ 
      success: true, 
      deletedCount: result.count 
    });
  } catch (error) {
    console.error('Error deleting all chats:', error);
    return NextResponse.json(
      { error: 'Failed to delete all chats' },
      { status: 500 }
    );
  }
}


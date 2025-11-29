import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { MessagesApiResponse, MessageResponse, ApiErrorResponse } from '@/types/api';

/**
 * GET /api/chats/[id]/messages
 * Get all messages for a specific chat
 * @returns MessagesApiResponse or ApiErrorResponse
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<MessagesApiResponse | ApiErrorResponse>> {
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
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return NextResponse.json<MessagesApiResponse>({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats/[id]/messages
 * Add a message to a chat
 * @returns MessageResponse or ApiErrorResponse
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ message: MessageResponse } | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;
    const body = await request.json() as { 
      role: string; 
      content: string | Array<{
        type: 'text' | 'image_url' | 'file';
        text?: string;
        image_url?: { url: string };
        file?: { url: string; filename?: string };
      }>;
    };
    const { role, content } = body;

    if (!role || !['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user", "assistant", or "system"' },
        { status: 400 }
      );
    }

    // Content can be string or array (multimodal)
    if (!content || (typeof content !== 'string' && !Array.isArray(content))) {
      return NextResponse.json(
        { error: 'Content is required and must be a string or array' },
        { status: 400 }
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
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId,
        role,
        content,
      },
    });

    // Update chat title if it's the first user message and chat has no title
    if (role === 'user' && !chat.title) {
      // Extract text from content for title
      const titleText = typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.find((item) => item.type === 'text')?.text || ''
          : '';
      
      const title = titleText.length > 50 ? titleText.substring(0, 50) + '...' : titleText;
      if (title) {
        await prisma.chat.update({
          where: { id: chatId },
          data: { title },
        });
      }
    }

    return NextResponse.json<{ message: MessageResponse }>({ message }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}


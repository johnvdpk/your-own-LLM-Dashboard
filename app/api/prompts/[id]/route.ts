import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiErrorResponse, UpdatePromptRequest, CreatePromptResponse } from '@/types/api';

/**
 * DELETE /api/prompts/[id]
 * Delete a single prompt for the authenticated user
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

    const { id: promptId } = await params;

    // Verify prompt belongs to user
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: session.user.id,
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Delete prompt
    await prisma.prompt.delete({
      where: { id: promptId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prompts/[id]
 * Update prompt title or content for the authenticated user
 * @returns CreatePromptResponse or ApiErrorResponse
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CreatePromptResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: promptId } = await params;
    const body = await request.json() as UpdatePromptRequest;
    const { title, content } = body;

    // Verify prompt belongs to user
    const prompt = await prisma.prompt.findFirst({
      where: {
        id: promptId,
        userId: session.user.id,
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // Validate input
    const updateData: { title?: string; content?: string } = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Content must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field (title or content) must be provided' },
        { status: 400 }
      );
    }

    // Update prompt
    const updatedPrompt = await prisma.prompt.update({
      where: { id: promptId },
      data: updateData,
    });

    return NextResponse.json<CreatePromptResponse>({ prompt: updatedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt' },
      { status: 500 }
    );
  }
}


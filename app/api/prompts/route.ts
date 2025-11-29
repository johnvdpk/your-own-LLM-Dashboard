// Next.js imports
import { NextRequest, NextResponse } from 'next/server';

// Internal imports
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Type imports
import type { PromptsApiResponse, CreatePromptRequest, CreatePromptResponse, DeletePromptsResponse, ApiErrorResponse } from '@/types/api';

/**
 * GET /api/prompts
 * Get all prompts for the authenticated user
 * @returns PromptsApiResponse or ApiErrorResponse
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<PromptsApiResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const prompts = await prisma.prompt.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json<PromptsApiResponse>({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to fetch prompts' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/prompts
 * Create a new prompt for the authenticated user
 * @returns CreatePromptResponse or ApiErrorResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreatePromptResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const body = await request.json() as CreatePromptRequest;
    const { title, content } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        content: content.trim(),
      },
    });

    return NextResponse.json<CreatePromptResponse>({ prompt }, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to create prompt' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/prompts
 * Delete all prompts for the authenticated user
 * @returns DeletePromptsResponse or ApiErrorResponse
 */
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<DeletePromptsResponse | ApiErrorResponse>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Delete all prompts for the user
    const result = await prisma.prompt.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json<DeletePromptsResponse>({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Error deleting all prompts:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to delete all prompts' },
      { status: 500 },
    );
  }
}


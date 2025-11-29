import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import type { ApiErrorResponse } from '@/types/api';

/**
 * POST /api/upload
 * Upload a file to local storage
 * Returns a public URL that can be used in OpenRouter messages
 */
export async function POST(request: NextRequest): Promise<NextResponse<{ url: string; filename: string } | ApiErrorResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (default: 10MB, configurable via env)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10) * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file type (optional, configurable via env)
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedTypes.includes(file.type) && !allowedTypes.includes('*')) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload file
    const result = await uploadFile(file);

    return NextResponse.json({
      url: result.url,
      filename: result.filename,
    });
  } catch (error) {
    console.error('File upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json<ApiErrorResponse>(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


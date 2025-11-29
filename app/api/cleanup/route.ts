import { NextRequest, NextResponse } from 'next/server';
import { cleanupOldFiles, getStorageStats } from '@/lib/storage';
import { auth } from '@/lib/auth';
import type { ApiErrorResponse } from '@/types/api';

/**
 * POST /api/cleanup
 * Cleanup old files based on retention policy
 * This endpoint can be called manually or via cron job
 * 
 * For cron job setup, add to your crontab:
 * 0 * * * * curl -X POST https://yourdomain.com/api/cleanup -H "Authorization: Bearer YOUR_SECRET_TOKEN"
 * 
 * Or use a cron service that calls this endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse<{
  success: boolean;
  deletedCount: number;
  stats: {
    totalFiles: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  };
} | ApiErrorResponse>> {
  try {
    // Optional: Add authentication for cleanup endpoint
    // You can use a secret token or require authentication
    const authHeader = request.headers.get('authorization');
    const cleanupSecret = process.env.CLEANUP_SECRET_TOKEN;

    if (cleanupSecret) {
      // If CLEANUP_SECRET_TOKEN is set, require it
      if (!authHeader || authHeader !== `Bearer ${cleanupSecret}`) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      // Otherwise, require user authentication
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json<ApiErrorResponse>(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Run cleanup
    const deletedCount = await cleanupOldFiles();
    const stats = await getStorageStats();

    return NextResponse.json({
      success: true,
      deletedCount,
      stats: {
        ...stats,
        oldestFile: stats.oldestFile?.toISOString() || null,
        newestFile: stats.newestFile?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cleanup files';
    return NextResponse.json<ApiErrorResponse>(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cleanup
 * Get storage statistics without running cleanup
 */
export async function GET(request: NextRequest): Promise<NextResponse<{
  stats: {
    totalFiles: number;
    totalSize: number;
    oldestFile: string | null;
    newestFile: string | null;
  };
  retentionHours: number;
} | ApiErrorResponse>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stats = await getStorageStats();
    const retentionHours = parseInt(process.env.FILE_RETENTION_HOURS || '24', 10);

    return NextResponse.json({
      stats: {
        ...stats,
        oldestFile: stats.oldestFile?.toISOString() || null,
        newestFile: stats.newestFile?.toISOString() || null,
      },
      retentionHours,
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return NextResponse.json<ApiErrorResponse>(
      { error: 'Failed to get storage stats' },
      { status: 500 }
    );
  }
}


import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Local file storage utility for VPS
 * Stores files in a configurable directory with automatic cleanup support
 */

// Get storage directory from environment or use default
const STORAGE_DIR = process.env.FILE_STORAGE_DIR || join(process.cwd(), 'storage', 'uploads');

// Get public URL - prefer NEXT_PUBLIC_APP_URL, fallback to localhost for development
const getPublicUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // For development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // Fallback
  return 'http://localhost:3000';
};

const PUBLIC_URL = getPublicUrl();
const FILE_RETENTION_HOURS = parseInt(process.env.FILE_RETENTION_HOURS || '24', 10);

/**
 * Ensure storage directory exists
 */
export async function ensureStorageDir(): Promise<void> {
  if (!existsSync(STORAGE_DIR)) {
    await mkdir(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Generate unique filename with timestamp and random string
 */
function generateFilename(originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split('.').pop() || '';
  const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${sanitizedName}_${timestamp}_${random}.${extension}`;
}

/**
 * Get file metadata (creation time)
 */
export async function getFileMetadata(filepath: string): Promise<{ createdAt: Date; size: number } | null> {
  try {
    const stats = await stat(filepath);
    return {
      createdAt: stats.birthtime,
      size: stats.size,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Upload file to local storage
 * @param file - File object from FormData
 * @returns Public URL to access the file (or base64 data URL for development)
 */
export async function uploadFile(file: File): Promise<{ url: string; filename: string; path: string; mimeType?: string }> {
  await ensureStorageDir();

  const filename = generateFilename(file.name);
  const filepath = join(STORAGE_DIR, filename);

  // Convert file to buffer and write
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filepath, buffer);

  // For development (localhost) or if URL contains "yourdomain", use base64 data URL for images
  // This ensures OpenRouter/Google can access the image without needing a public URL
  const isDevelopment = 
    PUBLIC_URL.includes('localhost') || 
    PUBLIC_URL.includes('127.0.0.1') ||
    PUBLIC_URL.includes('yourdomain.com'); // Fallback for unconfigured URLs
  
  let url: string;
  if (isDevelopment && file.type.startsWith('image/')) {
    // Use base64 data URL for images in development
    // This includes the mimetype in the URL itself: data:image/png;base64,...
    const base64 = buffer.toString('base64');
    url = `data:${file.type};base64,${base64}`;
  } else {
    // Use public URL for production or non-image files
    url = `${PUBLIC_URL}/api/files/${filename}`;
  }

  return {
    url,
    filename,
    path: filepath,
    mimeType: file.type,
  };
}

/**
 * Delete file from storage
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const filepath = join(STORAGE_DIR, filename);
    if (existsSync(filepath)) {
      await unlink(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filename}:`, error);
    return false;
  }
}

/**
 * Get file path for serving
 */
export function getFilePath(filename: string): string {
  return join(STORAGE_DIR, filename);
}

/**
 * Check if file exists
 */
export async function fileExists(filename: string): Promise<boolean> {
  const filepath = join(STORAGE_DIR, filename);
  return existsSync(filepath);
}

/**
 * Cleanup old files based on retention policy
 * @returns Number of files deleted
 */
export async function cleanupOldFiles(): Promise<number> {
  await ensureStorageDir();

  const files = await import('fs/promises').then((fs) => fs.readdir(STORAGE_DIR));
  const now = Date.now();
  const retentionMs = FILE_RETENTION_HOURS * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const filename of files) {
    const filepath = join(STORAGE_DIR, filename);
    try {
      const stats = await stat(filepath);
      const fileAge = now - stats.birthtime.getTime();

      // Delete if file is older than retention period
      if (fileAge > retentionMs) {
        await unlink(filepath);
        deletedCount++;
        console.log(`Deleted old file: ${filename} (age: ${Math.round(fileAge / (60 * 60 * 1000))} hours)`);
      }
    } catch (error) {
      console.error(`Error checking file ${filename}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestFile: Date | null;
  newestFile: Date | null;
}> {
  await ensureStorageDir();

  const files = await import('fs/promises').then((fs) => fs.readdir(STORAGE_DIR));
  let totalSize = 0;
  let oldestFile: Date | null = null;
  let newestFile: Date | null = null;

  for (const filename of files) {
    const filepath = join(STORAGE_DIR, filename);
    try {
      const stats = await stat(filepath);
      totalSize += stats.size;

      if (!oldestFile || stats.birthtime < oldestFile) {
        oldestFile = stats.birthtime;
      }
      if (!newestFile || stats.birthtime > newestFile) {
        newestFile = stats.birthtime;
      }
    } catch (error) {
      // Skip files that can't be stat'd
    }
  }

  return {
    totalFiles: files.length,
    totalSize,
    oldestFile,
    newestFile,
  };
}


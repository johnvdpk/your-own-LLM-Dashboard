import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET /api/test-db
 * Tests database connection and returns user count
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Test if we can connect to the database
    await prisma.$connect();
    
    // Try a simple query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true,
      message: '✅ Database connection successful!',
      userCount 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Unknown error occurred';
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
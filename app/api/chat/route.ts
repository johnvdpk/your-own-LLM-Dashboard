import { NextRequest, NextResponse } from 'next/server';

import { openRouter, getOpenRouterHeaders, ChatMessage } from '@/lib/openrouter';

/**
 * POST /api/chat
 * Handles chat message requests and forwards them to OpenRouter API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, model } = body;

    // Validate request body structure
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return NextResponse.json(
          { error: 'Invalid message role. Must be "user", "assistant", or "system"' },
          { status: 400 }
        );
      }
      if (typeof msg.content !== 'string') {
        return NextResponse.json(
          { error: 'Message content must be a string' },
          { status: 400 }
        );
      }
    }

    console.log('Sending request to OpenRouter:', { model: model || 'openai/gpt-4o', messageCount: messages.length });

    const completion = await openRouter.chat.send(
      {
        model: model || 'openai/gpt-4o',
        messages: messages as ChatMessage[],
        stream: false,
      },
      {
        headers: getOpenRouterHeaders(),
      }
    );

    console.log('OpenRouter response:', JSON.stringify(completion, null, 2));

    // Check if response has the expected structure
    if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error('Unexpected response structure:', completion);
      return NextResponse.json(
        { error: 'Unexpected response structure from OpenRouter' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: completion.choices[0].message,
    });
  } catch (error: unknown) {
    console.error('OpenRouter API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to get completion';
    
    const errorDetails = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : {};

    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error 
          ? error.stack 
          : undefined,
      },
      { status: 500 }
    );
  }
}


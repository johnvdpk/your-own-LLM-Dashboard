import { NextRequest, NextResponse } from 'next/server';
import { openRouter, getOpenRouterHeaders, ChatMessage } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    // Check if API key is set
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'OpenRouter API key is not configured' },
        { status: 500 }
      );
    }

    const { messages, model } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
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
  } catch (error: any) {
    console.error('OpenRouter API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get completion',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


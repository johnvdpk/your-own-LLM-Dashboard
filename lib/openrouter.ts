import { OpenRouter } from '@openrouter/sdk';

export const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Helper function to get default headers for OpenRouter requests
export function getOpenRouterHeaders() {
  return {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || '',
    'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'Chat App',
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}


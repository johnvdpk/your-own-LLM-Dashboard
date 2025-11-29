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

export type ChatMessageContent = 
  | string 
  | Array<{
      type: 'text' | 'image_url' | 'file';
      text?: string;
      image_url?: {
        url: string;
      };
      file?: {
        url: string;
        filename?: string;
      };
    }>;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: ChatMessageContent;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}


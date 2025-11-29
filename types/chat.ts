/**
 * Chat-related type definitions
 */

// Multimodal content types for OpenRouter API
export type MessageContentItem = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { url: string; filename?: string } };

export type MessageContent = string | MessageContentItem[];

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  timestamp: Date;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
}


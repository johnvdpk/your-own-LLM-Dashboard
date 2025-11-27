/**
 * API response type definitions
 * Centralized types for API request/response structures
 */

// Chat API Types
export interface ChatResponse {
  id: string;
  title: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    messages: number;
  };
}

export interface ChatsApiResponse {
  chats: ChatResponse[];
}

export interface CreateChatRequest {
  title?: string | null;
  model?: string;
}

export interface CreateChatResponse {
  chat: ChatResponse;
}

export interface UpdateChatRequest {
  title?: string | null;
  model?: string;
}

export interface DeleteChatsResponse {
  success: boolean;
  deletedCount: number;
}

// Message API Types
export interface MessageResponse {
  id: string;
  chatId: string;
  role: string;
  content: string;
  timestamp: string;
  createdAt: string;
}

export interface MessagesApiResponse {
  messages: MessageResponse[];
}

// Prompt API Types
export interface PromptResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptsApiResponse {
  prompts: PromptResponse[];
}

export interface CreatePromptRequest {
  title: string;
  content: string;
}

export interface CreatePromptResponse {
  prompt: PromptResponse;
}

export interface UpdatePromptRequest {
  title?: string;
  content?: string;
}

export interface DeletePromptsResponse {
  success: boolean;
  deletedCount: number;
}

// Completion API Types
export interface CompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model: string;
  chatId?: string;
}

export interface CompletionResponse {
  message: {
    role: 'assistant';
    content: string | Array<{
      type: string;
      text?: string;
    }>;
  };
}

// Error Response Type
export interface ApiErrorResponse {
  error: string;
  details?: string;
}


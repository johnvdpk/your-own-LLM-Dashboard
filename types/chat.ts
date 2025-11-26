export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
}


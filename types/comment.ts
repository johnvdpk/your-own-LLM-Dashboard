/**
 * Comment type definitions
 * Types for comment functionality on messages
 */

export interface Comment {
  id: string;
  messageId: string;
  userId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  userComment: string;
  aiResponse: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentRequest {
  messageId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  userComment: string;
  isQuestion?: boolean; // Optional: if true, will trigger AI response
}

export interface CommentResponse {
  id: string;
  messageId: string;
  userId: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  userComment: string;
  aiResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentsApiResponse {
  comments: CommentResponse[];
}

export interface CreateCommentResponse {
  comment: CommentResponse;
}

export interface ReplyToCommentRequest {
  userReply?: string;
}

export interface ReplyToCommentResponse {
  comment: CommentResponse;
}


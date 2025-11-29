'use client';

// React/Next.js imports
import type { CommentResponse } from '@/types/comment';

// CSS modules
import styles from './CommentBubble.module.css';

interface CommentBubbleProps {
  comment: CommentResponse;
  isActive: boolean;
  onClick: () => void;
}

/**
 * CommentBubble component that displays a comment indicator
 * @param comment - The comment object
 * @param isActive - Whether this comment is currently active/selected
 * @param onClick - Callback when bubble is clicked
 */
export function CommentBubble({ comment, isActive, onClick }: CommentBubbleProps) {
  return (
    <button
      className={`${styles.bubble} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      title={comment.userComment}
      aria-label={`Comment: ${comment.userComment}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
      </svg>
      {!comment.aiResponse && <span className={styles.unreadDot} aria-label="Unread comment" />}
    </button>
  );
}


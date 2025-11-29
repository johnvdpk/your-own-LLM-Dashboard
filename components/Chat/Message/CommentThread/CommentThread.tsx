'use client';

// React/Next.js imports
import { useState } from 'react';

// Type imports
import type { CommentResponse } from '@/types/comment';

// CSS modules
import styles from './CommentThread.module.css';

interface CommentThreadProps {
  comment: CommentResponse;
  onClose: () => void;
  onReply?: (reply: string) => Promise<void>;
}

/**
 * CommentThread component that displays a comment conversation
 * @param comment - The comment object with user question and AI response
 * @param onClose - Callback when thread is closed
 * @param onReply - Optional callback for follow-up questions
 */
export function CommentThread({ comment, onClose, onReply }: CommentThreadProps) {
  const [followUp, setFollowUp] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  /**
   * Handle follow-up question submission
   */
  const handleReply = async (): Promise<void> => {
    if (!followUp.trim() || !onReply || isReplying) return;

    setIsReplying(true);
    try {
      await onReply(followUp);
      setFollowUp('');
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  /**
   * Handle Enter key (with Shift for new line)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey && onReply) {
      e.preventDefault();
      handleReply();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className={styles.thread}>
      <div className={styles.header}>
        <h3 className={styles.title}>Commentaar</h3>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Sluiten"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className={styles.selectedTextSection}>
        <span className={styles.label}>Geselecteerde tekst:</span>
        <span className={styles.text}>"{comment.selectedText}"</span>
      </div>

      <div className={styles.conversation}>
        <div className={styles.message}>
          <div className={styles.messageHeader}>
            <span className={styles.messageRole}>Jij</span>
            <span className={styles.messageTime}>
              {new Date(comment.createdAt).toLocaleString('nl-NL', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className={styles.messageContent}>{comment.userComment}</div>
        </div>

        {comment.aiResponse ? (
          <div className={`${styles.message} ${styles.aiMessage}`}>
            <div className={styles.messageHeader}>
              <span className={styles.messageRole}>AI</span>
              <span className={styles.messageTime}>
                {new Date(comment.updatedAt).toLocaleString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className={styles.messageContent}>{comment.aiResponse}</div>
          </div>
        ) : (
          <div className={styles.loadingMessage}>
            <span>Wachten op AI antwoord...</span>
          </div>
        )}
      </div>

      {comment.aiResponse && onReply && (
        <div className={styles.replySection}>
          <textarea
            className={styles.replyInput}
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel een vervolgvraag..."
            rows={2}
            disabled={isReplying}
          />
          <button
            className={styles.replyButton}
            onClick={handleReply}
            disabled={isReplying || !followUp.trim()}
            type="button"
          >
            {isReplying ? 'Verzenden...' : 'Verzenden'}
          </button>
        </div>
      )}
    </div>
  );
}


'use client';

// React/Next.js imports
import { useState } from 'react';

// CSS modules
import styles from './CommentPanel.module.css';

interface CommentPanelProps {
  selectedText: string;
  onSave: (comment: string, isQuestion: boolean) => Promise<void>;
  onCancel: () => void;
}

/**
 * CommentPanel component for creating a new comment
 * @param selectedText - The text that was selected for commenting
 * @param onSave - Callback when comment is saved
 * @param onCancel - Callback when comment creation is cancelled
 */
export function CommentPanel({ selectedText, onSave, onCancel }: CommentPanelProps) {
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle form submission as note (no AI response)
   */
  const handleSaveAsNote = async (): Promise<void> => {
    if (!comment.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(comment, false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle form submission as question (with AI response)
   */
  const handleSaveAsQuestion = async (): Promise<void> => {
    if (!comment.trim() || isSaving) return;
    
    setIsSaving(true);
    try {
      await onSave(comment, true);
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle Enter key (with Shift for new line)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Escape') {
      onCancel();
    }
    // Note: We don't auto-submit on Enter anymore since we have two buttons
  };

  return (
    <div className={styles.panel}>
      <div className={styles.selectedText}>
        <span className={styles.label}>Geselecteerde tekst:</span>
        <span className={styles.text}>"{selectedText}"</span>
      </div>
      <textarea
        className={styles.input}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Voeg een notitie toe of stel een vraag..."
        rows={3}
        disabled={isSaving}
        autoFocus
      />
      <div className={styles.actions}>
        <button 
          className={styles.cancelButton}
          onClick={onCancel} 
          disabled={isSaving}
          type="button"
        >
          Annuleren
        </button>
        <button 
          className={styles.noteButton}
          onClick={handleSaveAsNote} 
          disabled={isSaving || !comment.trim()}
          type="button"
        >
          {isSaving ? 'Opslaan...' : 'Notitie'}
        </button>
        <button 
          className={styles.questionButton}
          onClick={handleSaveAsQuestion} 
          disabled={isSaving || !comment.trim()}
          type="button"
        >
          {isSaving ? 'Verzenden...' : 'Vraag stellen'}
        </button>
      </div>
    </div>
  );
}


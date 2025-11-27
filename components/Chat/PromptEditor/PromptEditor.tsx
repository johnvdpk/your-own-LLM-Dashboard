'use client';

import { useState, useEffect } from 'react';
import styles from './PromptEditor.module.css';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  initialTitle?: string;
  initialContent?: string;
}

/**
 * PromptEditor component - modal for creating/editing prompts
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback when modal should be closed
 * @param onSave - Callback when prompt should be saved
 */
export function PromptEditor({ isOpen, onClose, onSave, initialTitle, initialContent }: PromptEditorProps) {
  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update state when initial values change (for editing)
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || '');
      setContent(initialContent || '');
    }
  }, [isOpen, initialTitle, initialContent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(title.trim(), content.trim());
      setTitle('');
      setContent('');
      onClose();
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{initialTitle ? 'Prompt bewerken' : 'Nieuwe Prompt'}</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="prompt-title" className={styles.label}>
              Titel
            </label>
            <input
              id="prompt-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Geef je prompt een naam"
              required
              disabled={isSaving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="prompt-content" className={styles.label}>
              Inhoud
            </label>
            <textarea
              id="prompt-content"
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Schrijf hier je prompt..."
              rows={8}
              required
              disabled={isSaving}
            />
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuleren
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!title.trim() || !content.trim() || isSaving}
            >
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


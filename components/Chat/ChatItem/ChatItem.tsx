'use client';

// React/Next.js imports
import { useState, useEffect, useRef } from 'react';

// Type imports
import type { ChatResponse } from '@/types/api';

// CSS modules
import styles from './ChatItem.module.css';

interface ChatItemProps {
  chat: ChatResponse;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  onSaveEdit: (chatId: string, title: string) => Promise<void>;
}

/**
 * Format date for display
 * @param dateString - ISO date string to format
 * @returns Formatted date string in Dutch
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Vandaag';
  } else if (days === 1) {
    return 'Gisteren';
  } else if (days < 7) {
    return `${days} dagen geleden`;
  } else {
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  }
}

/**
 * Get display title for a chat
 * @param chat - The chat object
 * @returns The display title for the chat
 */
function getChatTitle(chat: ChatResponse): string {
  if (chat.title) {
    return chat.title;
  }
  return 'Nieuwe chat';
}

/**
 * ChatItem component that displays a single chat in the list
 * @param chat - The chat object to display
 * @param isSelected - Whether this chat is currently selected
 * @param isExpanded - Whether the sidebar is expanded
 * @param onSelect - Callback when chat is selected
 * @param onDelete - Callback when chat is deleted
 * @param onSaveEdit - Callback when chat title is saved
 */
export function ChatItem({
  chat,
  isSelected,
  isExpanded,
  onSelect,
  onDelete,
  onSaveEdit,
}: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  /**
   * Start editing chat title
   * @returns void
   */
  const handleStartEdit = (): void => {
    setIsEditing(true);
    setEditValue(chat.title || '');
    setIsMenuOpen(false);
  };

  /**
   * Save edited chat title
   * @returns Promise that resolves when title is saved
   */
  const handleSave = async (): Promise<void> => {
    await onSaveEdit(chat.id, editValue);
    setIsEditing(false);
    setEditValue('');
  };

  /**
   * Cancel editing chat title
   * @returns void
   */
  const handleCancel = (): void => {
    setIsEditing(false);
    setEditValue('');
  };

  /**
   * Handle keyboard events in edit input
   * @param e - Keyboard event
   * @returns void
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  /**
   * Handle delete action
   * @returns void
   */
  const handleDelete = (): void => {
    onDelete(chat.id);
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`${styles.wrapper} ${isSelected ? styles.active : ''}`}
      onMouseEnter={() => isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className={`${styles.chatItem} ${isSelected ? styles.active : ''}`}
        onClick={() => onSelect(chat.id)}
        title={isExpanded ? undefined : getChatTitle(chat)}
        aria-label={getChatTitle(chat)}
      >
        {/* chat icon */}
        <svg
          className={styles.chatIcon}
          viewBox="0 0 18 18"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M15.75 11.25a1.5 1.5 0 0 1-1.5 1.5H5.25l-3 3V3.75a1.5 1.5 0 0 1 1.5-1.5h10.5a1.5 1.5 0 0 1 1.5 1.5z"></path>
        </svg>
        {isExpanded && (
          <div className={styles.content}>
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                className={styles.editInput}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyPress}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <div className={styles.title}>{getChatTitle(chat)}</div>
                <div className={styles.meta}>{formatDate(chat.updatedAt)}</div>
              </>
            )}
          </div>
        )}
      </button>
      {isExpanded && isHovered && !isEditing && (
        <div className={styles.actions} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="Chat opties"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {isMenuOpen && (
            <div className={styles.menuDropdown}>
              <button
                className={styles.menuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEdit();
                }}
              >
                Naam veranderen
              </button>
              <button
                className={styles.menuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                Verwijderen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


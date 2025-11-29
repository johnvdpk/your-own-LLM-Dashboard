'use client';

// React/Next.js imports
import { useState, useEffect, useRef } from 'react';

// Type imports
import type { PromptResponse } from '@/types/api';

// CSS modules
import styles from './PromptItem.module.css';

interface PromptItemProps {
  prompt: PromptResponse;
  isExpanded: boolean;
  onEdit: (prompt: PromptResponse) => void;
  onDelete: (promptId: string) => void;
}

/**
 * PromptItem component that displays a single prompt in the list
 * @param prompt - The prompt object to display
 * @param isExpanded - Whether the sidebar is expanded
 * @param onEdit - Callback when prompt edit is requested
 * @param onDelete - Callback when prompt is deleted
 */
export function PromptItem({
  prompt,
  isExpanded,
  onEdit,
  onDelete,
}: PromptItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleEdit = (): void => {
    onEdit(prompt);
    setIsMenuOpen(false);
  };

  const handleDelete = (): void => {
    onDelete(prompt.id);
    setIsMenuOpen(false);
  };

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.promptItem}>
        {/* prompt icon */}
        <svg
          className={styles.promptIcon}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M9 12l2-2-2-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <line x1="13" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        {isExpanded && (
          <div className={styles.content}>
            <div className={styles.title}>{prompt.title}</div>
          </div>
        )}
      </div>
      {isExpanded && isHovered && (
        <div className={styles.actions} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            aria-label="Prompt opties"
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
                  handleEdit();
                }}
              >
                Bewerken
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


'use client';

import styles from './DeleteButton.module.css';

interface DeleteButtonProps {
  onClick: () => void;
  ariaLabel: string;
  title: string;
  size?: number;
}

/**
 * Reusable delete button component with trash icon
 * @param onClick - Callback when button is clicked
 * @param ariaLabel - Accessibility label for the button
 * @param title - Tooltip text
 * @param size - Icon size in pixels (default: 16)
 */
export function DeleteButton({
  onClick,
  ariaLabel,
  title,
  size = 16,
}: DeleteButtonProps) {
  return (
    <button
      className={styles.deleteButton}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </button>
  );
}


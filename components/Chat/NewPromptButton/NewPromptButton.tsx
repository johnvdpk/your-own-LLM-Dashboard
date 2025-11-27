'use client';

import styles from './NewPromptButton.module.css';

interface NewPromptButtonProps {
  onClick: () => void;
}

/**
 * NewPromptButton component - displays a plus icon button to create a new prompt
 * @param onClick - Callback when button is clicked
 */
export function NewPromptButton({ onClick }: NewPromptButtonProps) {
  return (
    <button className={styles.newPromptButton} onClick={onClick} aria-label="Nieuwe prompt">
      <span className={styles.plusIcon}>+</span>
    </button>
  );
}


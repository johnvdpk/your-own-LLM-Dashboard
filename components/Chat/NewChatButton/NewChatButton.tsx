'use client';

// CSS modules
import styles from './NewChatButton.module.css';

interface NewChatButtonProps {
  onClick: () => void;
}

/**
 * NewChatButton component - displays a plus icon button to create a new chat
 * @param onClick - Callback when button is clicked
 */
export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <button className={styles.newChatButton} onClick={onClick} aria-label="Nieuwe chat">
      <span className={styles.plusIcon}>+</span>
    </button>
  );
}


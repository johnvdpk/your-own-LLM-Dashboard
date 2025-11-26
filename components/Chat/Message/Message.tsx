import { Message } from '@/types/chat';

import styles from './Message.module.css';

interface MessageProps {
  message: Message;
}

/**
 * Message component that displays a single chat message
 * @param message - The message object to display
 */
export function Message({ message }: MessageProps) {
  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.content}>{message.content}</div>
    </div>
  );
}

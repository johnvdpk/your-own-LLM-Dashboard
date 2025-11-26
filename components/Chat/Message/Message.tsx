import { Message } from '@/types/chat';
import styles from './Message.module.css';

export default function MessageComponent({ message }: { message: Message }) {
  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.content}>{message.content}</div>
    </div>
  );
}

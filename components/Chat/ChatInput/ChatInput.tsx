'use client';

import { useState } from 'react';
import styles from './ChatInput.module.css';
import ModelSelector from '@/components/ModelSelector/ModelSelector/ModelSelector';


interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export default function ChatInput({ onSend, disabled, selectedModel, onModelChange }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do you want to know?"
          disabled={disabled}
          className={styles.input}
        />

        <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={styles.sendButton}
            title="Send message"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
      </div>
      
      <div className={styles.controls}>
        <div className={styles.leftControls}>
          <button
            type="button"
            className={styles.iconButton}
            disabled={disabled}
            title="Add attachment"
          >
            +
          </button>
          <button
            type="button"
            className={styles.iconButton}
            disabled={disabled}
            title="Settings"
          >
            ⚬⚬
          </button>
          <div className={styles.modelSelector}>
            <ModelSelector selectedModel={selectedModel} onModelChange={onModelChange} />
          </div>
        </div>
        <div className={styles.rightControls}>
          </div>
        
      </div>
    </form>
  );
}

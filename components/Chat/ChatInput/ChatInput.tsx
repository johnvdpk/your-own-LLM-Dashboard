'use client';

import { useState, useEffect, useRef } from 'react';

import { ModelSelector } from '@/components/ModelSelector/ModelSelector/ModelSelector';

import styles from './ChatInput.module.css';

interface Prompt {
  id: string;
  title: string;
  content: string;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

/**
 * ChatInput component that handles user message input and submission
 * @param onSend - Callback function called when message is submitted
 * @param disabled - Whether the input is disabled
 * @param selectedModel - Currently selected AI model
 * @param onModelChange - Callback function called when model is changed
 */
export function ChatInput({ onSend, disabled, selectedModel, onModelChange }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [suggestion, setSuggestion] = useState<string>('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts || []);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Check if input starts with "/"
    if (value.startsWith('/')) {
      // Extract everything after "/" - don't trim to allow spaces
      const afterSlash = value.substring(1);
      
      // Find the first space or end of string to determine prompt part
      const spaceIndex = afterSlash.indexOf(' ');
      const promptPart = spaceIndex === -1 ? afterSlash : afterSlash.substring(0, spaceIndex);
      
      if (promptPart.length > 0) {
        // Find matching prompts (case-insensitive)
        const matchingPrompts = prompts.filter(p => 
          p.title.toLowerCase().startsWith(promptPart.toLowerCase())
        );

        if (matchingPrompts.length > 0) {
          const firstMatch = matchingPrompts[0];
          // Only show suggestion if there's no space yet (user is still typing prompt name)
          if (spaceIndex === -1) {
            const remainingPart = firstMatch.title.substring(promptPart.length);
            setSuggestion(remainingPart);
            setShowSuggestion(true);
          } else {
            setSuggestion('');
            setShowSuggestion(false);
          }
        } else {
          setSuggestion('');
          setShowSuggestion(false);
        }
      } else {
        setSuggestion('');
        setShowSuggestion(false);
      }
    } else {
      setSuggestion('');
      setShowSuggestion(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab key to complete suggestion
    if (e.key === 'Tab' && showSuggestion && suggestion) {
      e.preventDefault();
      const afterSlash = input.substring(1);
      const spaceIndex = afterSlash.indexOf(' ');
      const promptPart = spaceIndex === -1 ? afterSlash : afterSlash.substring(0, spaceIndex);
      
      const matchingPrompt = prompts.find(p => 
        p.title.toLowerCase().startsWith(promptPart.toLowerCase())
      );
      
      if (matchingPrompt) {
        // Complete the prompt name, keep any text after space
        const remainingText = spaceIndex !== -1 ? afterSlash.substring(spaceIndex) : '';
        const completed = `/${matchingPrompt.title}${remainingText}`;
        setInput(completed);
        setSuggestion('');
        setShowSuggestion(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      setSuggestion('');
      setShowSuggestion(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} suppressHydrationWarning>
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to know?"
            disabled={disabled}
            className={styles.input}
            suppressHydrationWarning
          />
          {showSuggestion && suggestion && (
            <span className={styles.suggestion}>
              {suggestion}
            </span>
          )}
        </div>

        <button
            type="submit"
            disabled={disabled || !input.trim()}
            className={styles.sendButton}
            title="Send message"
            suppressHydrationWarning
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
            suppressHydrationWarning
          >
            +
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

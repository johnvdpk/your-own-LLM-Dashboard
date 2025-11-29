'use client';

// React/Next.js imports
import { useState, useEffect, useRef } from 'react';

// Component imports
import { ModelSelector } from '@/components/ModelSelector/ModelSelector/ModelSelector';

// CSS modules
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  /**
   * Load prompts from API
   * @returns Promise that resolves when prompts are loaded
   */
  const loadPrompts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const data = await response.json() as { prompts: Prompt[] };
        setPrompts(data.prompts ?? []);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  /**
   * Handle input change and show prompt suggestions
   * @param e - Change event from textarea
   * @returns void
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
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

  /**
   * Handle keyboard events (Enter to submit, Tab to complete suggestion)
   * @param e - Keyboard event from textarea
   * @returns void
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    // Shift+Enter allows new line (default behavior)
    // Enter key to submit (unless Shift is pressed)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled) {
        onSend(input.trim());
        setInput('');
        setSuggestion('');
        setShowSuggestion(false);
      }
      return;
    }

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

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form onSubmit={handleSubmit} className={styles.form} suppressHydrationWarning>
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={input}
            onChange={handleInputChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void}
            onKeyDown={handleKeyDown as (e: React.KeyboardEvent<HTMLTextAreaElement>) => void}
            placeholder="What do you want to know?"
            disabled={disabled}
            className={styles.input}
            rows={1}
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

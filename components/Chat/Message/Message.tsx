'use client';

// React/Next.js imports
import { useState } from 'react';

// Type imports
import type { Message } from '@/types/chat';
import type React from 'react';

// CSS modules
import styles from './Message.module.css';

interface MessageProps {
  message: Message;
}

/**
 * Parse message content and extract code blocks
 * @param content - The message content to parse
 * @returns Array of content parts (text or code)
 */
function parseContent(content: string): Array<{ type: 'text' | 'code'; content: string; language?: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  
  // Match code blocks: ```language\ncode\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Add code block
    const language = match[1] || '';
    const codeContent = match[2].trim();
    parts.push({ type: 'code', content: codeContent, language });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.substring(lastIndex);
    if (textContent.trim()) {
      parts.push({ type: 'text', content: textContent });
    }
  }

  // If no code blocks found, return entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
}

/**
 * Render text content with support for <b>, <i> tags and inline code
 * @param text - The text content to render
 * @returns React element with formatted text
 */
function renderFormattedText(text: string): React.ReactElement {
  // Split by HTML tags and inline code while preserving them
  const parts: Array<string | React.ReactElement> = [];
  let currentIndex = 0;
  
  // Match <b>...</b>, <i>...</i> tags and inline code `...`
  const combinedRegex = /<(b|i)>(.*?)<\/\1>|`([^`]+)`/g;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    // Check if it's a tag or inline code
    if (match[1]) {
      // HTML tag (<b> or <i>)
      const tag = match[1];
      const content = match[2];
      if (tag === 'b') {
        parts.push(<strong key={`bold-${match.index}`}>{content}</strong>);
      } else if (tag === 'i') {
        parts.push(<em key={`italic-${match.index}`}>{content}</em>);
      }
    } else if (match[3]) {
      // Inline code
      const codeContent = match[3];
      parts.push(
        <code key={`inline-code-${match.index}`} className={styles.inlineCode}>
          {codeContent}
        </code>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  // If no matches found, return original text
  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
}

/**
 * Copy code to clipboard
 * @param code - The code content to copy
 */
async function copyToClipboard(code: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(code);
  } catch (error) {
    console.error('Failed to copy code:', error);
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = code;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/**
 * Message component that displays a single chat message
 * @param message - The message object to display
 */
export function Message({ message }: MessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Convert content to string if it's an array
  const contentString = typeof message.content === 'string'
    ? message.content
    : message.content
        .filter((item) => item.type === 'text')
        .map((item) => (item as { type: 'text'; text: string }).text)
        .join('\n');
  
  const contentParts = parseContent(contentString);

  const handleCopy = async (code: string, index: number): Promise<void> => {
    await copyToClipboard(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={`${styles.message} ${styles[message.role]}`}>
      <div className={styles.content}>
        {contentParts.map((part, index) => {
          if (part.type === 'code') {
            return (
              <div key={index} className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  {part.language && (
                    <span className={styles.codeLanguage}>{part.language}</span>
                  )}
                  <button
                    className={styles.copyButton}
                    onClick={() => handleCopy(part.content, index)}
                    title="Copy code"
                  >
                    {copiedIndex === index ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
                <pre className={styles.codeContent}>
                  <code>{part.content}</code>
                </pre>
              </div>
            );
          } else {
            return (
              <div key={index} className={styles.textContent}>
                {renderFormattedText(part.content)}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

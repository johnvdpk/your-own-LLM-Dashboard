'use client';

// React/Next.js imports
import { useState, useEffect, useRef } from 'react';

// Type imports
import type { Message } from '@/types/chat';
import type { CommentResponse } from '@/types/comment';
import type React from 'react';

// Component imports
import { CommentBubble } from './CommentBubble/CommentBubble';
import { CommentPanel } from './CommentPanel/CommentPanel';
import { CommentThread } from './CommentThread/CommentThread';

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
 * Render text with comment highlights
 * @param text - The text content to render
 * @param comments - Array of comments for this message
 * @param startOffset - Starting character offset in the full message
 * @param onCommentClick - Callback when comment bubble is clicked
 * @param activeCommentId - Currently active comment ID
 * @returns React element with highlighted text
 */
function renderTextWithComments(
  text: string,
  comments: CommentResponse[],
  startOffset: number,
  onCommentClick: (commentId: string) => void,
  activeCommentId: string | null
): React.ReactElement {
  const parts: Array<string | React.ReactElement> = [];
  let currentIndex = 0;

  // Find comments that overlap with this text segment
  const relevantComments = comments.filter((comment) => {
    const commentEnd = comment.endOffset;
    const commentStart = comment.startOffset;
    const segmentEnd = startOffset + text.length;
    const segmentStart = startOffset;
    return commentStart < segmentEnd && commentEnd > segmentStart;
  });

  // Sort comments by start offset
  relevantComments.sort((a, b) => a.startOffset - b.startOffset);

  // Build parts with highlights
  relevantComments.forEach((comment) => {
    const commentStart = Math.max(0, comment.startOffset - startOffset);
    const commentEnd = Math.min(text.length, comment.endOffset - startOffset);

    if (commentStart > currentIndex) {
      // Add text before comment
      parts.push(text.substring(currentIndex, commentStart));
    }

    // Add highlighted comment text with bubble
    const highlightedText = text.substring(commentStart, commentEnd);
    parts.push(
      <span key={`comment-wrapper-${comment.id}`} className={styles.commentWrapper}>
        <mark
          className={styles.commentHighlight}
          data-comment-id={comment.id}
        >
          {highlightedText}
        </mark>
        <CommentBubble
          comment={comment}
          isActive={activeCommentId === comment.id}
          onClick={() => onCommentClick(comment.id)}
        />
      </span>
    );

    currentIndex = commentEnd;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  // If no comments, render normally
  if (parts.length === 0) {
    return <>{text}</>;
  }

  return <>{parts}</>;
}

/**
 * Message component that displays a single chat message
 * @param message - The message object to display
 */
export function Message({ message }: MessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [selectedText, setSelectedText] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Only allow comments on assistant messages
  const canComment = message.role === 'assistant';
  
  // Convert content to string if it's an array
  const contentString = typeof message.content === 'string'
    ? message.content
    : message.content
        .filter((item) => item.type === 'text')
        .map((item) => (item as { type: 'text'; text: string }).text)
        .join('\n');
  
  const contentParts = parseContent(contentString);

  // Load comments for this message
  useEffect(() => {
    if (canComment && message.id) {
      loadComments();
    }
  }, [canComment, message.id]);

  /**
   * Load comments for this message
   */
  const loadComments = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/comments?messageId=${message.id}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Handle text selection
  useEffect(() => {
    if (!canComment || !contentRef.current) return;

    const handleMouseUp = (): void => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      if (selectedText.length > 0 && contentRef.current?.contains(range.commonAncestorContainer)) {
        // Calculate offsets relative to message content
        const preRange = document.createRange();
        preRange.selectNodeContents(contentRef.current);
        preRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preRange.toString().length;

        preRange.setEnd(range.endContainer, range.endOffset);
        const endOffset = preRange.toString().length;

        setSelectedText({
          text: selectedText,
          startOffset,
          endOffset,
        });
        setShowCommentInput(true);
        selection.removeAllRanges();
      } else {
        setSelectedText(null);
        setShowCommentInput(false);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canComment, contentString]);

  /**
   * Handle creating a new comment
   * @param userComment - The comment text
   * @param isQuestion - Whether this is a question (triggers AI response) or just a note
   */
  const handleCreateComment = async (userComment: string, isQuestion: boolean): Promise<void> => {
    if (!selectedText) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          selectedText: selectedText.text,
          startOffset: selectedText.startOffset,
          endOffset: selectedText.endOffset,
          userComment,
          isQuestion, // Indicate if this should trigger AI response
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error creating comment:', data, response.status);
        throw new Error(data.error || `Failed to create comment (${response.status})`);
      }

      console.log('Comment created successfully:', data);

      // Reload comments to get the new one
      await loadComments();
      
      // Set the new comment as active
      if (data.comment?.id) {
        setActiveCommentId(data.comment.id);
        setShowCommentInput(false);
        setSelectedText(null);
        
        // Only trigger AI response if it's a question
        if (isQuestion) {
          try {
            const replyResponse = await fetch(`/api/comments/${data.comment.id}/reply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });

            if (replyResponse.ok) {
              await loadComments();
            }
          } catch (error) {
            console.error('Error generating AI reply:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Fout bij het aanmaken van commentaar. Probeer het opnieuw.');
    }
  };

  /**
   * Handle AI reply to comment
   */
  const handleReply = async (userReply: string): Promise<void> => {
    if (!activeCommentId) return;

    try {
      const response = await fetch(`/api/comments/${activeCommentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userReply }),
      });

      if (response.ok) {
        await loadComments();
        // Reload to get updated comment with AI response
        const updatedComment = await response.json();
        setComments((prev) =>
          prev.map((c) => (c.id === activeCommentId ? updatedComment.comment : c))
        );
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  /**
   * Get comment for highlighted text
   */
  const getCommentForHighlight = (commentId: string): CommentResponse | undefined => {
    return comments.find((c) => c.id === commentId);
  };

  const handleCopy = async (code: string, index: number): Promise<void> => {
    await copyToClipboard(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Calculate character offsets for each part
  let currentOffset = 0;

  const hasPanel = canComment && showCommentInput && selectedText;
  const hasThread = canComment && activeCommentId;

  return (
    <div className={`${styles.message} ${styles[message.role]} ${canComment ? styles.commentable : ''} ${hasPanel ? styles.hasPanel : ''} ${hasThread ? styles.hasThread : ''}`}>
      <div className={styles.content} ref={contentRef}>
        {contentParts.map((part, index) => {
          const partStartOffset = currentOffset;
          const partEndOffset = currentOffset + part.content.length;
          currentOffset = partEndOffset;

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
                {canComment
                  ? renderTextWithComments(
                      part.content,
                      comments,
                      partStartOffset,
                      (commentId) => setActiveCommentId(
                        activeCommentId === commentId ? null : commentId
                      ),
                      activeCommentId
                    )
                  : renderFormattedText(part.content)}
              </div>
            );
          }
        })}
      </div>


      {/* Comment input panel */}
      {canComment && showCommentInput && selectedText && (
        <CommentPanel
          selectedText={selectedText.text}
          onSave={handleCreateComment}
          onCancel={() => {
            setShowCommentInput(false);
            setSelectedText(null);
          }}
        />
      )}

      {/* Active comment thread panel */}
      {canComment && activeCommentId && (() => {
        const activeComment = comments.find((c) => c.id === activeCommentId);
        if (!activeComment) return null;

        return (
          <CommentThread
            comment={activeComment}
            onClose={() => setActiveCommentId(null)}
            onReply={handleReply}
          />
        );
      })()}
    </div>
  );
}

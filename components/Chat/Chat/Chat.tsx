'use client';

// React/Next.js imports
import { useState, useEffect, useRef } from 'react';

// Type imports
import type { Message } from '@/types/chat';
import type { MessageResponse } from '@/types/api';

// Component imports
import { Message as MessageComponent } from '@/components/Chat/Message/Message';
import { ChatInput } from '@/components/Chat/ChatInput/ChatInput';

// Utility imports
import { resolvePromptSyntax } from '@/lib/prompt-resolver';
import { typewriterEffect } from '@/hooks/useTypewriter';

// CSS modules
import styles from './Chat.module.css';

interface ChatProps {
  userName: string;
  chatId: string | null;
  onChatCreated?: (chatId: string) => void;
}

/**
 * Chat component that handles message sending and receiving
 * @param userName - The current user's name
 * @param chatId - The current chat ID (null for new chat)
 * @param onChatCreated - Callback when a new chat is created
 */
export function Chat({ userName, chatId, onChatCreated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('anthropic/claude-3.5-sonnet');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update currentChatId when prop changes
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  // Load messages for the current chat
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  // Auto-scroll to bottom when messages or streaming message changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage, isLoading]);

  /**
   * Load messages from database for a specific chat
   * @param chatIdToLoad - The ID of the chat to load messages for
   * @returns Promise that resolves when messages are loaded
   */
  const loadMessages = async (chatIdToLoad: string): Promise<void> => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/chats/${chatIdToLoad}/messages`);

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json() as { messages: MessageResponse[] };
      const loadedMessages: Message[] = (data.messages ?? []).map((msg) => ({
        id: msg.id,
        role: msg.role as Message['role'],
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /**
   * Create a new chat
   * @returns The new chat ID or null if creation failed
   */
  const createChat = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: null,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json() as { chat: { id: string } };
      return data.chat.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  /**
   * Sends a message to the chat API and handles the streaming response with typewriter effect
   * @param content - The message content to send
   */
  const sendMessage = async (content: string): Promise<void> => {
    // Resolve prompt syntax if present
    const resolvedContent = await resolvePromptSyntax(content);

    // If resolved content is null (prompt not found), show error and don't send
    if (resolvedContent === null) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Prompt niet gevonden. Controleer de titel en probeer het opnieuw.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // If resolved content is empty, don't send
    if (!resolvedContent.trim()) {
      return;
    }

    // If no chat exists, create one first
    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
      const newChatId = await createChat();
      if (!newChatId) {
        return;
      }
      chatIdToUse = newChatId;
      setCurrentChatId(newChatId);

      // Trigger parent to update chatId and reload chat list
      if (onChatCreated) {
        onChatCreated(newChatId);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: resolvedContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          model: selectedModel,
          chatId: chatIdToUse,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as { message: { content: string | Array<{ type: string; [key: string]: unknown }> } };

      // Check if response has the expected structure
      if (!data.message || !data.message.content) {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Extract text content from response (handle both string and multimodal)
      const content = data.message.content;
      const fullText = typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.find((item) => item.type === 'text' && typeof item.text === 'string')?.text || ''
          : '';

      // Typewriter effect
      await typewriterEffect(fullText, setStreamingMessage, 20);

      // Add final message after typewriter completes
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessage('');
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      const errorMessageText = error instanceof Error
        ? error.message
        : 'Failed to send message. Please check your API key and try again.';

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${errorMessageText}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messagesContainer}>
        {isLoadingMessages ? (
          <div className={styles.loading}>
            <span className={styles.thinking}>Berichten laden</span>
          </div>
        ) : (
          <>
            {messages.length === 0 && !isLoading ? (
              <div className={styles.emptyState}>
                <p>Start een nieuwe conversatie door een bericht te sturen.</p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageComponent key={message.id} message={message} />
              ))
            )}
          </>
        )}
        {streamingMessage && (
          <MessageComponent
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingMessage,
              timestamp: new Date(),
            }}
          />
        )}
        {isLoading && !streamingMessage && (
          <div className={styles.loading}>
            <span className={styles.thinking}>Thinking</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputSection}>
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

import type { Message } from '@/types/chat';
import type { MessageResponse, PromptsApiResponse } from '@/types/api';
import { Message as MessageComponent } from '@/components/Chat/Message/Message';
import { ChatInput } from '@/components/Chat/ChatInput/ChatInput';

import styles from './Chat.module.css';

interface ChatProps {
  userName: string;
  chatId: string | null;
  onChatCreated?: (chatId: string) => void;
}

export function Chat({ userName, chatId, onChatCreated }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('anthropic/claude-3.5-sonnet');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);

  // Update currentChatId when prop changes
  useEffect(() => {
    setCurrentChatId(chatId);
  }, [chatId]);

  /**
   * Load messages for the current chat
   */
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  /**
   * Load messages from database for a specific chat
   * @param chatIdToLoad - The ID of the chat to load messages for
   */
  const loadMessages = async (chatIdToLoad: string): Promise<void> => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/chats/${chatIdToLoad}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json() as { messages: MessageResponse[] };
      const loadedMessages: Message[] = (data.messages || []).map((msg) => ({
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
   * Resolve prompt syntax: "/titel tekst" -> "[prompt content] tekst"
   * @param content - The message content that may contain prompt syntax
   * @returns The resolved content with prompt replaced but rest of text preserved
   */
  const resolvePromptSyntax = async (content: string): Promise<string> => {
    // Check if content starts with "/"
    if (!content.trim().startsWith('/')) {
      return content;
    }

    // Extract prompt title and remaining text
    // Match "/titel" followed by optional space and remaining text
    const match = content.match(/^\/(\S+)(?:\s+(.*))?$/);
    if (!match) {
      return content;
    }

    const promptTitle = match[1].trim();
    const remainingText = match[2] || '';
    
    if (!promptTitle) {
      return content;
    }

    try {
      // Fetch all prompts for the user
      const response = await fetch('/api/prompts');
      
      if (!response.ok) {
        console.error('Failed to fetch prompts');
        return content;
      }

      const data = await response.json() as PromptsApiResponse;
      const prompts = data.prompts || [];

      // Find prompt with matching title (case-insensitive)
      const prompt = prompts.find((p) => 
        p.title.toLowerCase() === promptTitle.toLowerCase()
      );

      if (prompt) {
        // Replace "/titel" with prompt content, keep remaining text
        const resolvedContent = remainingText.trim() 
          ? `${prompt.content} ${remainingText.trim()}`
          : prompt.content;
        return resolvedContent;
      } else {
        // Prompt not found, show error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Prompt "${promptTitle}" niet gevonden. Controleer de titel en probeer het opnieuw.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return ''; // Don't send the message
      }
    } catch (error) {
      console.error('Error resolving prompt:', error);
      return content;
    }
  };

  /**
   * Sends a message to the chat API and handles the streaming response with typewriter effect
   * @param content - The message content to send
   */
  const sendMessage = async (content: string): Promise<void> => {
    // Resolve prompt syntax if present
    const resolvedContent = await resolvePromptSyntax(content);
    
    // If resolved content is empty (prompt not found), don't send
    if (!resolvedContent.trim()) {
      return;
    }

    // If no chat exists, create one first
    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
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
        chatIdToUse = data.chat.id;
        
        // Update local state
        setCurrentChatId(chatIdToUse);
        
        // Trigger parent to update chatId and reload chat list
        if (onChatCreated && chatIdToUse) {
          onChatCreated(chatIdToUse);
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        return;
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

      const data = await response.json() as { message: { content: string } };
      
      // Check if response has the expected structure
      if (!data.message || !data.message.content) {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Typewriter effect: simulate streaming by adding words one by one
      // This creates a more engaging user experience than showing the full message at once
      const fullText = data.message.content;
      const words = fullText.split(' ');
      let currentText = '';

      // Display words with 20ms delay between each word for smooth animation
      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20));
        currentText += (i > 0 ? ' ' : '') + words[i];
        setStreamingMessage(currentText);
      }

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

  /**
   * Get greeting based on time of day
   * @returns Greeting string ('Morning', 'Afternoon', or 'Evening')
   */
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.greeting}>
        <span className={styles.greetingIcon}>👋</span>
        <h1 className={styles.greetingText}>{getGreeting()}, {userName}</h1>
      </div>

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

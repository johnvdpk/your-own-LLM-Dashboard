'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { Message } from '@/types/chat';
import { Message as MessageComponent } from '@/components/Chat/Message/Message';
import { ChatInput } from '@/components/Chat/ChatInput/ChatInput';

import styles from './Chat.module.css';

interface ChatProps {
  userName: string;
}

export function Chat({ userName }: ChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('anthropic/claude-3.5-sonnet');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  /**
   * Sends a message to the chat API and handles the streaming response with typewriter effect
   * @param content - The message content to send
   */
  const sendMessage = async (content: string): Promise<void> => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat', {
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
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

  /**
   * Handle logout action
   */
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className={styles.chatContainer}>
      <button className={styles.logoutButton} onClick={handleLogout}>
        Uitloggen
      </button>
      <div className={styles.greeting}>
        <span className={styles.greetingIcon}>👋</span>
        <h1 className={styles.greetingText}>{getGreeting()}, {userName}</h1>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <MessageComponent key={message.id} message={message} />
        ))}
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

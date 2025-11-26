'use client';

import { useState, useEffect } from 'react';
import { Message } from '@/types/chat';
import MessageComponent from '../Message/Message';
import ChatInput from '../ChatInput/ChatInput';
import ModelSelector from '@/components/ModelSelector/ModelSelector/ModelSelector';
import styles from './Chat.module.css';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('anthropic/claude-3.5-sonnet');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const sendMessage = async (content: string) => {
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

      // Typewriter effect: add words one by one
      const fullText = data.message.content;
      const words = fullText.split(' ');
      let currentText = '';

      // Faster typewriter effect (20ms per word)
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to send message. Please check your API key and try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.greeting}>
        <span className={styles.greetingIcon}>✦</span>
        <h1 className={styles.greetingText}>{getGreeting()}, John</h1>
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
        <ChatInput onSend={sendMessage} disabled={isLoading} />
        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
      </div>
    </div>
  );
}

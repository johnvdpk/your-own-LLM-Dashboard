'use client';

import { useState, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { ChatList } from '@/components/Chat/ChatList/ChatList';
import { Chat } from '@/components/Chat/Chat/Chat';

import styles from './ChatLayout.module.css';

interface ChatLayoutProps {
  userName: string;
}

/**
 * ChatLayout component that manages the overall chat interface
 * Includes sidebar with chat list, new chat button, and main chat area
 */
export function ChatLayout({ userName }: ChatLayoutProps) {
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatListKey, setChatListKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Handle logout action
   */
  const handleLogout = async (): Promise<void> => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  

  /**
   * Handle chat selection
   * @param chatId - The ID of the selected chat, or null to deselect
   */
  const handleChatSelect = useCallback((chatId: string | null): void => {
    setSelectedChatId(chatId);
  }, []);

  /**
   * Handle chat created from Chat component
   * @param chatId - The ID of the newly created chat
   */
  const handleChatCreated = useCallback((chatId: string): void => {
    setSelectedChatId(chatId);
    setChatListKey(prev => prev + 1);
  }, []);

  /**
   * Handle creating a new chat
   */
  const handleNewChat = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: null,
          model: 'anthropic/claude-3.5-sonnet',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const data = await response.json() as { chat: { id: string } };
      setSelectedChatId(data.chat.id);
      setChatListKey(prev => prev + 1);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }, []);

  return (
    <div className={styles.chatLayout}>
      <div className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <button 
          className={styles.menuToggle} 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            {isSidebarOpen ? (
              <>
                <rect x="3" y="4" width="13" height="16" rx="1"></rect>
                <rect x="16" y="4" width="5" height="16" rx="1"></rect>
              </>
            ) : (
              <>
                <rect x="3" y="4" width="3" height="16" rx="1"></rect>
                <rect x="6" y="4" width="13" height="16" rx="1"></rect>
              </>
            )}
          </svg>
        </button>
        <ChatList 
          key={chatListKey}
          selectedChatId={selectedChatId} 
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          isExpanded={isSidebarOpen}
        />
      </div>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          {!isSidebarOpen && (
            <button 
              className={styles.menuToggle} 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="4" width="3" height="16" rx="1"></rect>
                <rect x="6" y="4" width="13" height="16" rx="1"></rect>
              </svg>
            </button>
          )}
          <button className={styles.logoutButton} onClick={handleLogout}>
            Uitloggen
          </button>
        </div>
        <div className={styles.chatArea}>
          <Chat 
            userName={userName} 
            chatId={selectedChatId}
            onChatCreated={handleChatCreated}
          />
        </div>
      </div>
    </div>
  );
}


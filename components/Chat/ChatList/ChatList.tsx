'use client';

// React/Next.js imports
import { useEffect, useState } from 'react';

// Type imports
import type { ChatResponse, PromptResponse } from '@/types/api';

// Component imports
import { NewChatButton } from '@/components/Chat/NewChatButton/NewChatButton';
import { NewPromptButton } from '@/components/Chat/NewPromptButton/NewPromptButton';
import { PromptEditor } from '@/components/Chat/PromptEditor/PromptEditor';
import { ChatItem } from '@/components/Chat/ChatItem/ChatItem';
import { PromptItem } from '@/components/Chat/PromptItem/PromptItem';
import { DeleteButton } from '@/components/Chat/DeleteButton/DeleteButton';
import { ConfirmDialog } from '@/components/Chat/ConfirmDialog/ConfirmDialog';

// CSS modules
import styles from './ChatList.module.css';

interface ChatListProps {
  selectedChatId: string | null;
  onChatSelect: (chatId: string | null) => void;
  onNewChat?: () => void;
  isExpanded?: boolean;
}

/**
 * ChatList component that displays all chats for the current user
 * @param selectedChatId - The currently selected chat ID
 * @param onChatSelect - Callback when a chat is selected
 * @param onNewChat - Callback when new chat button is clicked
 * @param isExpanded - Whether the sidebar is expanded to show titles
 */
export function ChatList({ selectedChatId, onChatSelect, onNewChat, isExpanded = false }: ChatListProps) {
  const [chats, setChats] = useState<ChatResponse[]>([]);
  const [prompts, setPrompts] = useState<PromptResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<PromptResponse | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteAllPromptsConfirm, setShowDeleteAllPromptsConfirm] = useState(false);
  const [showDeleteAllEverythingConfirm, setShowDeleteAllEverythingConfirm] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  useEffect(() => {
    loadChats();
    loadPrompts();
  }, []);

  // Reload chats when selectedChatId changes (new chat created)
  useEffect(() => {
    if (selectedChatId) {
      loadChats();
    }
  }, [selectedChatId]);

  /**
   * Load all chats for the current user
   * @returns Promise that resolves when chats are loaded
   */
  const loadChats = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chats');
      
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }

      const data = await response.json() as { chats: ChatResponse[] };
      setChats(data.chats ?? []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load all prompts for the current user
   * @returns Promise that resolves when prompts are loaded
   */
  const loadPrompts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/prompts');
      
      if (!response.ok) {
        throw new Error('Failed to load prompts');
      }

      const data = await response.json() as { prompts: PromptResponse[] };
      setPrompts(data.prompts ?? []);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  /**
   * Handle deleting a single chat
   * @param chatId - The ID of the chat to delete
   * @returns Promise that resolves when chat is deleted
   */
  const handleDeleteChat = async (chatId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Reload chats
      await loadChats();

      // Deselect if deleted chat was selected
      if (selectedChatId === chatId) {
        onChatSelect(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  /**
   * Handle deleting all chats
   * @returns Promise that resolves when all chats are deleted
   */
  const handleDeleteAllChats = async (): Promise<void> => {
    try {
      const response = await fetch('/api/chats', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all chats');
      }

      // Reload chats
      await loadChats();

      // Deselect current chat
      onChatSelect(null);

      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error('Error deleting all chats:', error);
    }
  };

  /**
   * Save edited chat title
   * @param chatId - The ID of the chat to update
   * @param title - The new title
   * @returns Promise that resolves when title is saved
   */
  const handleSaveEdit = async (chatId: string, title: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || null,
        },),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      // Reload chats
      await loadChats();
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  /**
   * Handle saving a new prompt
   * @param title - The prompt title
   * @param content - The prompt content
   * @returns Promise that resolves when prompt is saved
   * @throws Error if prompt creation fails
   */
  const handleSavePrompt = async (title: string, content: string): Promise<void> => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create prompt');
      }

      // Reload prompts
      await loadPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      throw error;
    }
  };

  /**
   * Handle deleting a single prompt
   * @param promptId - The ID of the prompt to delete
   * @returns Promise that resolves when prompt is deleted
   */
  const handleDeletePrompt = async (promptId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      // Reload prompts
      await loadPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  /**
   * Handle deleting all prompts
   * @returns Promise that resolves when all prompts are deleted
   */
  const handleDeleteAllPrompts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/prompts', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all prompts');
      }

      // Reload prompts
      await loadPrompts();

      setShowDeleteAllPromptsConfirm(false);
    } catch (error) {
      console.error('Error deleting all prompts:', error);
    }
  };

  /**
   * Handle deleting everything (chats and prompts)
   * @returns Promise that resolves when everything is deleted
   */
  const handleDeleteAll = async (): Promise<void> => {
    try {
      // Delete all chats
      await fetch('/api/chats', {
        method: 'DELETE',
      });

      // Delete all prompts
      await fetch('/api/prompts', {
        method: 'DELETE',
      });

      // Reload both
      await loadChats();
      await loadPrompts();

      // Deselect current chat
      onChatSelect(null);

      setShowDeleteAllEverythingConfirm(false);
    } catch (error) {
      console.error('Error deleting all:', error);
    }
  };

  /**
   * Start editing prompt
   * @param prompt - The prompt to edit
   * @returns void
   */
  const handleStartEditPrompt = (prompt: PromptResponse): void => {
    setEditingPrompt(prompt);
    setShowPromptEditor(true);
  };

  /**
   * Handle updating prompt in editor
   * @param title - The updated prompt title
   * @param content - The updated prompt content
   * @returns Promise that resolves when prompt is updated
   * @throws Error if prompt update fails
   */
  const handleUpdatePrompt = async (title: string, content: string): Promise<void> => {
    if (!editingPrompt) return;

    try {
      const response = await fetch(`/api/prompts/${editingPrompt.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }

      // Reload prompts
      await loadPrompts();

      setEditingPrompt(null);
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.chatList}>
        <div className={styles.loading}>Laden...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.chatList} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {isExpanded && (
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>Chats</h2>
          {chats.length > 0 && (
            <DeleteButton
              onClick={() => setShowDeleteAllConfirm(true)}
              ariaLabel="Verwijder alle chats"
              title="Verwijder alle chats"
              size={16}
            />
          )}
        </div>
      )}
      {onNewChat && (
        <div className={styles.newChatButtonWrapper}>
          <NewChatButton onClick={onNewChat} />
        </div>
      )}
      <div className={styles.chatItems}>
        {chats.length === 0 ? (
          <div className={styles.empty}>{isExpanded ? 'Geen chats gevonden' : 'Geen chats'}</div>
        ) : (
          chats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              isExpanded={isExpanded}
              onSelect={onChatSelect}
              onDelete={handleDeleteChat}
              onSaveEdit={handleSaveEdit}
            />
          ))
        )}
      </div>
      <div className={styles.promptButtonWrapper}>
        <NewPromptButton onClick={() => setShowPromptEditor(true)} />
      </div>
      {isExpanded && (
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>Prompts</h2>
          {prompts.length > 0 && (
            <DeleteButton
              onClick={() => setShowDeleteAllPromptsConfirm(true)}
              ariaLabel="Verwijder alle prompts"
              title="Verwijder alle prompts"
              size={16}
            />
          )}
        </div>
      )}
      <div className={styles.promptItems}>
        {prompts.length === 0 ? (
          <div className={styles.empty}>{isExpanded ? 'Geen prompts gevonden' : ''}</div>
        ) : (
          prompts.map((prompt) => (
            <PromptItem
              key={prompt.id}
              prompt={prompt}
              isExpanded={isExpanded}
              onEdit={handleStartEditPrompt}
              onDelete={handleDeletePrompt}
            />
          ))
        )}
      </div>
      {isExpanded && (prompts.length > 0 || chats.length > 0) && (
        <div className={styles.deleteAllWrapper}>
          <DeleteButton
            onClick={() => setShowDeleteAllEverythingConfirm(true)}
            ariaLabel="Verwijder alles"
            title="Verwijder alles"
            size={18}
          />
        </div>
      )}
      <ConfirmDialog
        isOpen={showDeleteAllConfirm}
        message="Weet je zeker dat je alle chats wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
        onConfirm={handleDeleteAllChats}
        onCancel={() => setShowDeleteAllConfirm(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteAllPromptsConfirm}
        message="Weet je zeker dat je alle prompts wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
        onConfirm={handleDeleteAllPrompts}
        onCancel={() => setShowDeleteAllPromptsConfirm(false)}
      />
      <ConfirmDialog
        isOpen={showDeleteAllEverythingConfirm}
        message="Weet je zeker dat je alles wilt verwijderen? Alle chats en prompts worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt."
        onConfirm={handleDeleteAll}
        onCancel={() => setShowDeleteAllEverythingConfirm(false)}
      />
      <PromptEditor
        isOpen={showPromptEditor}
        onClose={() => {
          setShowPromptEditor(false);
          setEditingPrompt(null);
        }}
        onSave={editingPrompt ? handleUpdatePrompt : handleSavePrompt}
        initialTitle={editingPrompt?.title}
        initialContent={editingPrompt?.content}
      />
    </div>
  );
}

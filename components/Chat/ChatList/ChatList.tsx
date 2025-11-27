'use client';

import { useEffect, useState, useRef } from 'react';

import type { ChatResponse, PromptResponse } from '@/types/api';
import { NewChatButton } from '@/components/Chat/NewChatButton/NewChatButton';
import { NewPromptButton } from '@/components/Chat/NewPromptButton/NewPromptButton';
import { PromptEditor } from '@/components/Chat/PromptEditor/PromptEditor';

import styles from './ChatList.module.css';

// Use API types for component state
type Chat = ChatResponse;
type Prompt = PromptResponse;

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
  const [chats, setChats] = useState<Chat[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [menuOpenChatId, setMenuOpenChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const [menuOpenPromptId, setMenuOpenPromptId] = useState<string | null>(null);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteAllPromptsConfirm, setShowDeleteAllPromptsConfirm] = useState(false);
  const [showDeleteAllEverythingConfirm, setShowDeleteAllEverythingConfirm] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const promptMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenChatId(null);
      }
      if (promptMenuRef.current && !promptMenuRef.current.contains(event.target as Node)) {
        setMenuOpenPromptId(null);
      }
    };

    if (menuOpenChatId || menuOpenPromptId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpenChatId, menuOpenPromptId]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  /**
   * Load all chats for the current user
   */
  const loadChats = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chats');
      
      if (!response.ok) {
        throw new Error('Failed to load chats');
      }

      const data = await response.json() as { chats: ChatResponse[] };
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load all prompts for the current user
   */
  const loadPrompts = async (): Promise<void> => {
    try {
      const response = await fetch('/api/prompts');
      
      if (!response.ok) {
        throw new Error('Failed to load prompts');
      }

      const data = await response.json() as { prompts: PromptResponse[] };
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  };

  /**
   * Get display title for a chat
   * @param chat - The chat object
   * @returns The display title for the chat
   */
  const getChatTitle = (chat: Chat): string => {
    if (chat.title) {
      return chat.title;
    }
    return 'Nieuwe chat';
  };

  /**
   * Format date for display
   * @param dateString - ISO date string to format
   * @returns Formatted date string in Dutch
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Vandaag';
    } else if (days === 1) {
      return 'Gisteren';
    } else if (days < 7) {
      return `${days} dagen geleden`;
    } else {
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }
  };

  /**
   * Handle deleting a single chat
   * @param chatId - The ID of the chat to delete
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

      setMenuOpenChatId(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  /**
   * Handle deleting all chats
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
   * Start editing chat title
   * @param chat - The chat to edit
   */
  const handleStartEdit = (chat: Chat): void => {
    setEditingChatId(chat.id);
    setEditTitleValue(chat.title || '');
    setMenuOpenChatId(null);
  };

  /**
   * Save edited chat title
   * @param chatId - The ID of the chat to update
   */
  const handleSaveEdit = async (chatId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitleValue.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat title');
      }

      // Reload chats
      await loadChats();

      setEditingChatId(null);
      setEditTitleValue('');
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  /**
   * Cancel editing
   */
  const handleCancelEdit = (): void => {
    setEditingChatId(null);
    setEditTitleValue('');
  };

  /**
   * Handle key press in edit input
   */
  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, chatId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(chatId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  /**
   * Handle saving a new prompt
   * @param title - The prompt title
   * @param content - The prompt content
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

      setMenuOpenPromptId(null);
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  /**
   * Handle deleting all prompts
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
   */
  const handleStartEditPrompt = (prompt: Prompt): void => {
    setEditingPrompt(prompt);
    setShowPromptEditor(true);
    setMenuOpenPromptId(null);
  };

  /**
   * Handle updating prompt in editor
   * @param title - The updated prompt title
   * @param content - The updated prompt content
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
      {isExpanded && <h2 className={styles.title}>Chats</h2>}
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
            <div
              key={chat.id}
              className={`${styles.chatItemWrapper} ${selectedChatId === chat.id ? styles.active : ''}`}
              onMouseEnter={() => isExpanded && setHoveredChatId(chat.id)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              <button
                className={`${styles.chatItem} ${selectedChatId === chat.id ? styles.active : ''}`}
                onClick={() => onChatSelect(chat.id)}
                title={isExpanded ? undefined : getChatTitle(chat)}
                aria-label={getChatTitle(chat)}
              >
                <svg 
                  className={styles.chatIcon} 
                  viewBox="0 0 18 18" 
                  width="18" 
                  height="18"
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                >
                  <path d="M15.75 11.25a1.5 1.5 0 0 1-1.5 1.5H5.25l-3 3V3.75a1.5 1.5 0 0 1 1.5-1.5h10.5a1.5 1.5 0 0 1 1.5 1.5z"></path>
                </svg>
                {isExpanded && (
                  <div className={styles.chatItemContent}>
                    {editingChatId === chat.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        className={styles.editInput}
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onBlur={() => handleSaveEdit(chat.id)}
                        onKeyDown={(e) => handleEditKeyPress(e, chat.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className={styles.chatItemTitle}>{getChatTitle(chat)}</div>
                    )}
                    <div className={styles.chatItemMeta}>{formatDate(chat.updatedAt)}</div>
                  </div>
                )}
              </button>
              {isExpanded && hoveredChatId === chat.id && editingChatId !== chat.id && (
                <div className={styles.chatItemActions} ref={menuRef}>
                  <button
                    className={styles.menuButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenChatId(menuOpenChatId === chat.id ? null : chat.id);
                    }}
                    aria-label="Chat opties"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  {menuOpenChatId === chat.id && (
                    <div className={styles.menuDropdown}>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(chat);
                        }}
                      >
                        Naam veranderen
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className={styles.promptButtonWrapper}>
        <NewPromptButton onClick={() => setShowPromptEditor(true)} />
      </div>
      {isExpanded && <h2 className={styles.title}>Prompts</h2>}
      <div className={styles.promptItems}>
        {prompts.length === 0 ? (
          <div className={styles.empty}>{isExpanded ? 'Geen prompts gevonden' : ''}</div>
        ) : (
          prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={styles.promptItemWrapper}
              onMouseEnter={() => isExpanded && setHoveredPromptId(prompt.id)}
              onMouseLeave={() => setHoveredPromptId(null)}
            >
              <div className={styles.promptItem}>
                <svg 
                  className={styles.promptIcon} 
                  viewBox="0 0 18 18" 
                  width="18" 
                  height="18"
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1"
                >
                  <path d="M14 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"></path>
                  <path d="M6 6h6M6 10h6M6 14h4"></path>
                </svg>
                {isExpanded && (
                  <div className={styles.promptItemContent}>
                    <div className={styles.promptItemTitle}>{prompt.title}</div>
                  </div>
                )}
              </div>
              {isExpanded && hoveredPromptId === prompt.id && (
                <div className={styles.promptItemActions} ref={promptMenuRef}>
                  <button
                    className={styles.menuButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenPromptId(menuOpenPromptId === prompt.id ? null : prompt.id);
                    }}
                    aria-label="Prompt opties"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="5" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="19" r="1.5" />
                    </svg>
                  </button>
                  {menuOpenPromptId === prompt.id && (
                    <div className={styles.menuDropdown}>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditPrompt(prompt);
                        }}
                      >
                        Bewerken
                      </button>
                      <button
                        className={styles.menuItem}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.id);
                        }}
                      >
                        Verwijderen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {isExpanded && (prompts.length > 0 || chats.length > 0) && (
        <div className={styles.deleteAllWrapper}>
          {prompts.length > 0 && (
            <button
              className={styles.deleteAllButton}
              onClick={() => setShowDeleteAllPromptsConfirm(true)}
            >
              Verwijder alle prompts
            </button>
          )}
          {chats.length > 0 && (
            <button
              className={styles.deleteAllButton}
              onClick={() => setShowDeleteAllConfirm(true)}
            >
              Verwijder alle chats
            </button>
          )}
          {(prompts.length > 0 || chats.length > 0) && (
            <button
              className={styles.deleteAllButton}
              onClick={() => setShowDeleteAllEverythingConfirm(true)}
            >
              Verwijder alles
            </button>
          )}
        </div>
      )}
      {showDeleteAllConfirm && (
        <div className={styles.confirmDialogOverlay} onClick={() => setShowDeleteAllConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Weet je het zeker?</h3>
            <p>Alle chats worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className={styles.confirmDialogActions}>
              <button
                className={styles.confirmButton}
                onClick={handleDeleteAllChats}
              >
                Verwijderen
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAllPromptsConfirm && (
        <div className={styles.confirmDialogOverlay} onClick={() => setShowDeleteAllPromptsConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Weet je het zeker?</h3>
            <p>Alle prompts worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className={styles.confirmDialogActions}>
              <button
                className={styles.confirmButton}
                onClick={handleDeleteAllPrompts}
              >
                Verwijderen
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteAllPromptsConfirm(false)}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteAllEverythingConfirm && (
        <div className={styles.confirmDialogOverlay} onClick={() => setShowDeleteAllEverythingConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3>Weet je het zeker?</h3>
            <p>Alle chats en prompts worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.</p>
            <div className={styles.confirmDialogActions}>
              <button
                className={styles.confirmButton}
                onClick={handleDeleteAll}
              >
                Verwijderen
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteAllEverythingConfirm(false)}
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
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


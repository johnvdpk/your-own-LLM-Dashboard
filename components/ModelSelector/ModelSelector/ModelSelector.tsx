'use client';

// React/Next.js imports
import { useState, useEffect, useRef } from 'react';

// CSS modules
import styles from './ModelSelector.module.css';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
  requiresUpgrade?: boolean;
}

const models: Model[] = [
  {
    id: 'anthropic/claude-3-opus',
    name: 'Opus 4.5',
    description: 'Most capable for complex work',
    provider: 'Anthropic',
    requiresUpgrade: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Sonnet 4.5',
    description: 'Smartest for everyday tasks',
    provider: 'Anthropic',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Haiku 4.5',
    description: 'Fastest for quick answers',
    provider: 'Anthropic',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Most advanced OpenAI model',
    provider: 'OpenAI',
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Fast and capable',
    provider: 'OpenAI',
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Latest Google model',
    provider: 'Google',
  },
];

/**
 * ModelSelector component that allows users to select an AI model
 * @param selectedModel - Currently selected model ID
 * @param onModelChange - Callback function called when model is changed
 */
export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModelData = models.find((m) => m.id === selectedModel) || models[1];

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const dropdownHeight = 400; // max-height
      const spaceAbove = containerRect.top;
      const spaceBelow = window.innerHeight - containerRect.bottom;
      const viewportWidth = window.innerWidth;
      
      // Calculate right position (align with container right edge)
      const right = viewportWidth - containerRect.right;
      
      // Position dropdown above if there's more space above
      if (spaceAbove >= dropdownHeight || spaceAbove > spaceBelow) {
        setDropdownPosition({
          bottom: window.innerHeight - containerRect.top + 8, // margin-bottom
          right: right,
        });
      } else {
        setDropdownPosition({
          top: containerRect.bottom + 8, // margin-top
          right: right,
        });
      }
    }
  }, [isOpen]);

  // Close dropdown when clicking outside the component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        className={styles.selector}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        suppressHydrationWarning
      >
        <span className={styles.selectedModel}>{selectedModelData.name}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
      </button>
      {isOpen && (
        <>
          <div 
            className={styles.dropdown}
            ref={dropdownRef}
            style={dropdownPosition}
          >
          {models.map((model) => (
            <button
              key={model.id}
              className={styles.option}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
              type="button"
            >
              <div className={styles.optionContent}>
                <span className={styles.modelName}>{model.name}</span>
                <span className={styles.modelDescription}>{model.description}</span>
              </div>
              {selectedModel === model.id && (
                <span className={styles.checkmark}>✓</span>
              )}
              {model.requiresUpgrade && selectedModel !== model.id && (
                <div
                  className={styles.upgradeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle upgrade logic here
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle upgrade logic here
                    }
                  }}
                >
                  Upgrade
                </div>
              )}
            </button>
          ))}
          <button
            className={styles.moreModels}
            onClick={() => {
              // Handle "More models" logic
              setIsOpen(false);
            }}
            type="button"
          >
            More models
            <span className={styles.moreModelsArrow}>›</span>
          </button>
        </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModelData = models.find((m) => m.id === selectedModel) || models[1];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.selector}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className={styles.selectedModel}>{selectedModelData.name}</span>
        <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className={styles.dropdown}>
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
                <button
                  className={styles.upgradeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle upgrade logic here
                  }}
                  type="button"
                >
                  Upgrade
                </button>
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
      )}
    </div>
  );
}

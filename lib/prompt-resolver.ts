import type { PromptResponse } from '@/types/api';

/**
 * Resolve prompt syntax: "/titel tekst" -> "[prompt content] tekst"
 * @param content - The message content that may contain prompt syntax
 * @returns The resolved content with prompt replaced but rest of text preserved
 */
export async function resolvePromptSyntax(content: string): Promise<string | null> {
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

    const data = await response.json() as { prompts: PromptResponse[] };
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
      // Prompt not found, return null to indicate error
      return null;
    }
  } catch (error) {
    console.error('Error resolving prompt:', error);
    return content;
  }
}


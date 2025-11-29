import type { CompletionRequest } from '@/types/api';

/**
 * Validate message structure
 * @param msg - Message object to validate
 * @returns Error message if invalid, null if valid
 */
function validateMessage(msg: unknown): string | null {
  if (typeof msg !== 'object' || msg === null) {
    return 'Message must be an object';
  }

  const message = msg as Record<string, unknown>;

  // Validate role
  if (!message.role || !['user', 'assistant', 'system'].includes(message.role as string)) {
    return 'Invalid message role. Must be "user", "assistant", or "system"';
  }

  // Validate content
  if (typeof message.content !== 'string' && !Array.isArray(message.content)) {
    return 'Message content must be a string or array';
  }

  // If content is array, validate structure
  if (Array.isArray(message.content)) {
    for (const item of message.content) {
      if (typeof item !== 'object' || item === null || !('type' in item)) {
        return 'Invalid content array item. Each item must have a type property';
      }

      const contentItem = item as Record<string, unknown>;

      if (contentItem.type === 'text' && typeof contentItem.text !== 'string') {
        return 'Text content items must have a text property';
      }

      if (contentItem.type === 'image_url' && (!contentItem.image_url || typeof (contentItem.image_url as Record<string, unknown>).url !== 'string')) {
        return 'Image content items must have an image_url object with url property';
      }

      if (contentItem.type === 'file' && (!contentItem.file || typeof (contentItem.file as Record<string, unknown>).url !== 'string')) {
        return 'File content items must have a file object with url property';
      }
    }
  }

  return null;
}

/**
 * Validate completion request body
 * @param body - Request body to validate
 * @returns Error message if invalid, null if valid
 */
export function validateCompletionRequest(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be an object';
  }

  const request = body as Record<string, unknown>;

  // Validate messages array
  if (!request.messages || !Array.isArray(request.messages)) {
    return 'Messages array is required';
  }

  // Validate each message
  for (const msg of request.messages) {
    const error = validateMessage(msg);
    if (error) {
      return error;
    }
  }

  return null;
}


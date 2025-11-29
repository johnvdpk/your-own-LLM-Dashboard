/**
 * Convert message content to string format
 * @param content - Message content (string or array)
 * @returns String representation of content
 */
export function getContentAsString(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    // Extract text from content array items
    return content
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          if ('type' in item && item.type === 'text' && 'text' in item) {
            return typeof item.text === 'string' ? item.text : '';
          }
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

/**
 * Get full multimodal content (preserves images)
 * @param content - Message content
 * @param reasoning - Optional reasoning text from assistant
 * @returns Multimodal content (string or array)
 */
export function getContentAsMultimodal(
  content: unknown,
  reasoning?: unknown
): string | Array<{ type: string; [key: string]: unknown }> {
  if (Array.isArray(content)) {
    return content;
  }
  
  // If content is empty string or falsy but there's reasoning, return reasoning as text
  if ((!content || (typeof content === 'string' && content.trim() === '')) && reasoning) {
    return typeof reasoning === 'string' ? reasoning : String(reasoning);
  }
  
  if (typeof content === 'string') {
    return content;
  }
  
  return content as string | Array<{ type: string; [key: string]: unknown }>;
}

/**
 * Combine text content with detected images
 * @param textContent - Text content string
 * @param detectedImages - Array of detected images
 * @returns Multimodal content array
 */
export function combineContentWithImages(
  textContent: string,
  detectedImages: Array<{ type: 'image_url'; image_url: { url: string } }>
): Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> {
  const contentArray: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
  
  // Add text content if available
  if (textContent && textContent.trim()) {
    contentArray.push({
      type: 'text',
      text: textContent,
    });
  }
  
  // Add detected images
  detectedImages.forEach((img) => {
    contentArray.push(img);
  });
  
  return contentArray;
}


import type { ChatMessage } from '@/lib/openrouter';

/**
 * Determine MIME type from URL or data URL
 * @param url - URL string (can be data URL or regular URL)
 * @returns MIME type string
 */
function getMimeTypeFromUrl(url: string): string {
  // Check if it's a base64 data URL (data:image/png;base64,...)
  if (url.startsWith('data:')) {
    const mimeTypeMatch = url.match(/^data:([^;]+)/);
    if (mimeTypeMatch && mimeTypeMatch[1]) {
      return mimeTypeMatch[1];
    }
  }
  
  // Otherwise, determine from file extension
  const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
  const mimeTypeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
  };
  return mimeTypeMap[extension || ''] || 'image/png'; // Default to png if unknown
}

/**
 * Check if model is a Gemini model
 * @param model - Model identifier string
 * @returns True if model is a Gemini model
 */
export function isGeminiModel(model: string): boolean {
  return model.startsWith('google/gemini');
}

/**
 * Transform messages for Gemini models (they use camelCase: imageUrl instead of image_url)
 * @param messages - Array of chat messages
 * @param model - Model identifier string
 * @returns Transformed messages array
 */
export function transformMessagesForGemini(messages: ChatMessage[], model: string): ChatMessage[] {
  const isGemini = isGeminiModel(model);
  
  if (!isGemini) {
    // For non-Gemini models, just add mimetype to image_url items
    return messages.map((msg) => {
      if (typeof msg.content === 'string') {
        return msg;
      }
      
      if (Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map((item) => {
            if (item.type === 'image_url' && item.image_url) {
              const imageUrl = item.image_url.url;
              const mimeType = getMimeTypeFromUrl(imageUrl);
              
              return {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  mimetype: mimeType,
                },
              };
            }
            return item;
          }),
        };
      }
      
      return msg;
    });
  }
  
  // For Gemini models, transform to camelCase
  return messages.map((msg) => {
    if (typeof msg.content === 'string') {
      return msg;
    }
    
    if (Array.isArray(msg.content)) {
      return {
        ...msg,
        content: msg.content.map((item) => {
          // Transform image_url to imageUrl for Gemini
          if (item.type === 'image_url' && item.image_url) {
            const imageUrl = item.image_url.url;
            const mimeType = getMimeTypeFromUrl(imageUrl);
            
            return {
              type: 'image_url',
              imageUrl: {
                url: imageUrl,
                mimeType: mimeType,
              },
            };
          }
          
          // Keep text and file as is
          if (item.type === 'text' && item.text) {
            return {
              type: 'text',
              text: item.text,
            };
          }
          
          if (item.type === 'file' && item.file) {
            return {
              type: 'file',
              file: {
                url: item.file.url,
                filename: item.file.filename,
              },
            };
          }
          
          return item;
        }),
      };
    }
    
    return msg;
  });
}


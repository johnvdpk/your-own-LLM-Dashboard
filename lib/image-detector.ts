/**
 * Image item type for detected images
 */
export interface DetectedImage {
  type: 'image_url';
  image_url: { url: string };
}

/**
 * Extract image URL from various formats
 * @param item - Image item in various formats
 * @returns Image URL string or null
 */
function extractImageUrl(item: unknown): string | null {
  if (typeof item === 'string') {
    return item;
  }

  if (typeof item === 'object' && item !== null) {
    const obj = item as Record<string, unknown>;
    
    // Try different possible properties
    if (typeof obj.url === 'string') {
      return obj.url;
    }
    if (typeof obj.data === 'string') {
      return obj.data;
    }
    if (typeof obj.imageUrl === 'string') {
      return obj.imageUrl;
    }
    if (typeof obj.image === 'string') {
      return obj.image;
    }
  }

  return null;
}

/**
 * Convert base64 data to data URL if needed
 * @param imageData - Image data (can be base64 string or data URL)
 * @param mimeType - MIME type (default: 'image/png')
 * @returns Data URL string
 */
function convertToDataUrl(imageData: string, mimeType = 'image/png'): string {
  if (imageData.startsWith('data:')) {
    return imageData;
  }
  return `data:${mimeType};base64,${imageData}`;
}

/**
 * Detect images in OpenRouter completion response
 * @param completion - OpenRouter completion response
 * @returns Array of detected images
 */
export function detectImagesInResponse(completion: unknown): DetectedImage[] {
  const detectedImages: DetectedImage[] = [];
  const responseAny = completion as Record<string, unknown>;
  
  // Get assistant message
  const choices = responseAny.choices as Array<{ message: Record<string, unknown> }> | undefined;
  if (!choices || !choices[0] || !choices[0].message) {
    return detectedImages;
  }

  const assistantMessage = choices[0].message;

  // Check content array for images
  if (Array.isArray(assistantMessage.content)) {
    assistantMessage.content.forEach((item: unknown) => {
      const itemObj = item as Record<string, unknown>;
      
      if (itemObj.type === 'image_url' && itemObj.image_url) {
        const imageUrl = extractImageUrl((itemObj.image_url as Record<string, unknown>).url);
        if (imageUrl) {
          detectedImages.push({
            type: 'image_url',
            image_url: { url: imageUrl },
          });
        }
      } else if (itemObj.type === 'image' && itemObj.image) {
        const imageUrl = extractImageUrl(itemObj.image);
        if (imageUrl) {
          detectedImages.push({
            type: 'image_url',
            image_url: { url: imageUrl },
          });
        }
      } else if (itemObj.inlineData?.data) {
        const inlineData = itemObj.inlineData as Record<string, unknown>;
        const imageData = inlineData.data as string;
        const mimeType = (inlineData.mimeType as string) || 'image/png';
        const imageUrl = convertToDataUrl(imageData, mimeType);
        detectedImages.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }
    });
  }

  // Check for images in other response fields
  if (responseAny.images && Array.isArray(responseAny.images)) {
    responseAny.images.forEach((img: unknown) => {
      const imageUrl = extractImageUrl(img);
      if (imageUrl) {
        detectedImages.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }
    });
  }

  if (responseAny.image_urls && Array.isArray(responseAny.image_urls)) {
    responseAny.image_urls.forEach((url: unknown) => {
      if (typeof url === 'string') {
        detectedImages.push({
          type: 'image_url',
          image_url: { url },
        });
      }
    });
  }

  // Check for images in parts (Gemini-specific structure)
  if (responseAny.parts && Array.isArray(responseAny.parts)) {
    responseAny.parts.forEach((part: unknown) => {
      const partObj = part as Record<string, unknown>;
      if (partObj.inlineData?.data || partObj.imageUrl || partObj.image) {
        const imageData = extractImageUrl(
          (partObj.inlineData as Record<string, unknown>)?.data ||
          partObj.imageUrl ||
          partObj.image
        );
        if (imageData) {
          const imageUrl = imageData.startsWith('data:')
            ? imageData
            : convertToDataUrl(imageData);
          detectedImages.push({
            type: 'image_url',
            image_url: { url: imageUrl },
          });
        }
      }
    });
  }

  // Check for inlineData in the message itself
  if ((assistantMessage as Record<string, unknown>).inlineData?.data) {
    const inlineData = (assistantMessage as Record<string, unknown>).inlineData as Record<string, unknown>;
    const imageData = inlineData.data as string;
    const mimeType = (inlineData.mimeType as string) || 'image/png';
    const imageUrl = convertToDataUrl(imageData, mimeType);
    detectedImages.push({
      type: 'image_url',
      image_url: { url: imageUrl },
    });
  }

  return detectedImages;
}


/**
 * Typewriter effect function that displays text word by word
 * @param text - The full text to display
 * @param onUpdate - Callback called with current text after each word
 * @param speed - Delay in milliseconds between words (default: 20)
 * @returns Promise that resolves when typewriter completes
 */
export async function typewriterEffect(
  text: string,
  onUpdate: (currentText: string) => void,
  speed = 20
): Promise<void> {
  if (!text) {
    onUpdate('');
    return;
  }

  const words = text.split(' ');
  let currentText = '';

  for (let i = 0; i < words.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, speed));
    currentText += (i > 0 ? ' ' : '') + words[i];
    onUpdate(currentText);
  }
}


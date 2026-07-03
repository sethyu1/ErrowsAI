/**
 * Sanitizes text input to prevent XSS attacks and any special that may casue llm error
 * Removes HTML tags and script content, but preserves Unicode characters
 * @param text - Input text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Step 1: Remove HTML tags (prevents XSS)
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Step 2: Decode HTML entities to plain text
  const textarea = document.createElement('textarea');
  textarea.innerHTML = sanitized;
  sanitized = textarea.value;
  
  // Step 3: Remove script-related patterns (extra safety)
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/data:/gi, ''); // Remove data URIs
  
  // Step 4: Remove control characters (but keep printable Unicode)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 5: Remove all special characters, keep only letters, numbers, spaces, and allowed punctuation
  // Keep: letters (A-Z, a-z, Unicode letters), numbers (0-9), spaces, and specific punctuation
  // Allowed punctuation: , . ? ! * ~ ？ ！ ～ ： ， 。 ·
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s,\.\?!\*~？！～：，。·]/gu, '');
  
  // Step 6: Normalize whitespace (collapse multiple spaces)
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized.trim();
}

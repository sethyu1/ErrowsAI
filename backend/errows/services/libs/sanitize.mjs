/**
 * Sanitizes text input to prevent XSS attacks and any special that may casue llm error
 * Removes HTML tags and script content, but preserves Unicode characters
 * @param {string} text - Input text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Step 1: Remove HTML tags (prevents XSS)
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Step 2: Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
  
  // Step 3: Remove script-related patterns
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, ''); // Remove data URIs
  
  // Step 4: Remove control characters (but keep printable Unicode)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Step 5: Remove all special characters, keep only letters, numbers, spaces, and allowed punctuation
  // Keep: letters (A-Z, a-z, Unicode letters), numbers (0-9), spaces, and specific punctuation
  // Allowed punctuation: , . ? ! * ~ ？ ！ ～ ： ， 。 ·
  // Note: Node.js supports Unicode property escapes (\p{L}, \p{N}) in regex
  sanitized = sanitized.replace(/[^\p{L}\p{N}\s,\.\?!\*~？！～：，。·]/gu, '');
  
  // Step 6: Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized.trim();
}

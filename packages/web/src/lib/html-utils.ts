/**
 * Utilities for handling content that may be HTML or plain text.
 */

/** Check if a string contains HTML tags */
export function isHtmlContent(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

/** Strip HTML tags and return plain text */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text for an HTML text node or a quoted attribute value. Deck and
 * card text is plain by contract, but a view renders it inside the user's
 * chat client, so it is escaped here too (spec 11: never raw HTML).
 * @param text - the text to escape
 * @returns the escaped text
 */
export function escapeHtml(text: string): string {
  return text.replaceAll(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

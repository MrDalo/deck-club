/**
 * The terminal command that adds the Deck Club MCP server to Claude Code.
 * @param mcpUrl - the public MCP endpoint
 * @returns the command, with TOKEN as the placeholder for the access token
 */
export function claudeCodeCommand(mcpUrl: string): string {
  return `claude mcp add --transport http deck-club ${mcpUrl} --header "Authorization: Bearer TOKEN"`;
}

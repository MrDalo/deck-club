import { createHash } from 'node:crypto';

/** How long a handshake name is remembered; longer than any chat session. */
const ENTRY_TTL_MS = 12 * 60 * 60 * 1000;

/** Upper bound on remembered names, so a token flood cannot grow memory without limit. */
const MAX_ENTRIES = 10_000;

/**
 * Remembers the client name from the MCP `initialize` handshake for later
 * requests that carry the same access token. Needed for 2025-era clients
 * only: after their one `initialize`, stateless requests no longer name the
 * client, whereas 2026-07-28 requests carry `clientInfo` in every request's
 * `_meta` envelope. Keys are SHA-256 digests: the raw token is never stored.
 * Per process only; a miss falls back to the User-Agent.
 */
export class ClientNameRegistry {
  private readonly entries = new Map<string, { name: string; expiresAt: number }>();

  /** @param now - the clock, injectable for tests */
  constructor(private readonly now: () => number = Date.now) {}

  /** Remembers `clientName` for requests carrying `accessToken`. */
  remember(accessToken: string, clientName: string): void {
    if (this.entries.size >= MAX_ENTRIES) this.evictOldest();
    this.entries.set(digest(accessToken), {
      name: clientName,
      expiresAt: this.now() + ENTRY_TTL_MS,
    });
  }

  /** @returns the name remembered for `accessToken`, unless it expired */
  recall(accessToken: string): string | undefined {
    const key = digest(accessToken);
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.name;
  }

  private evictOldest(): void {
    const oldest = this.entries.keys().next();
    if (oldest.done !== true) this.entries.delete(oldest.value);
  }
}

const digest = (token: string): string => createHash('sha256').update(token).digest('hex');

import { MCP_SCOPES, type McpScope } from '@deck-club/contracts';
import type { AuthInfo } from '@modelcontextprotocol/server';

/**
 * Who is calling a tool: the signed-in user, the AI client acting for them
 * and what that client may do. Built once per HTTP request from the verified
 * access token; every use case receives it, nothing else identifies a user.
 */
export type McpCaller = {
  /** The verified bearer token, forwarded to the core API (which verifies it again). */
  accessToken: string;
  /** The Supabase user id (JWT `sub`). */
  userId: string;
  /** The OAuth client of the AI connection, or null for a pasted session token. */
  clientId: string | null;
  /** Display name for provenance, e.g. "Claude" on "Added by Claude". */
  clientName: string;
  /** Scopes this AI connection was granted. */
  scopes: readonly McpScope[];
};

/** `AuthInfo.clientId` of a Supabase session token pasted by hand (it names no OAuth client). */
export const SESSION_TOKEN_CLIENT_ID = 'deck-club-session';

/** Shown when the AI client cannot be recognised. */
export const UNKNOWN_CLIENT_NAME = 'AI assistant';

/** What the auth gate stores in `AuthInfo.extra`; read back by {@link callerFromAuthInfo}. */
type CallerExtra = { userId: string; clientName: string };

const isScope = (scope: string): scope is McpScope =>
  (MCP_SCOPES as readonly string[]).includes(scope);

/**
 * Packs a verified caller into the SDK's `AuthInfo`, the one value the MCP
 * SDK carries from the HTTP request to every handler.
 * @param caller - the verified caller
 * @param expiresAt - token expiry in seconds since the epoch
 * @returns the SDK auth info
 */
export function toAuthInfo(caller: McpCaller, expiresAt: number): AuthInfo {
  const extra: CallerExtra = { userId: caller.userId, clientName: caller.clientName };
  return {
    token: caller.accessToken,
    clientId: caller.clientId ?? SESSION_TOKEN_CLIENT_ID,
    scopes: [...caller.scopes],
    expiresAt,
    extra,
  };
}

/**
 * Returns a copy of the auth info naming the AI client, once the request
 * body has been read (the name arrives in the MCP handshake, not the token).
 * @param authInfo - auth info from the gate
 * @param clientName - the resolved display name
 * @returns the auth info with the client name set
 */
export function withClientName(authInfo: AuthInfo, clientName: string): AuthInfo {
  return { ...authInfo, extra: { ...authInfo.extra, clientName } };
}

/**
 * Unpacks the caller the auth gate verified.
 * @param authInfo - `ctx.authInfo` of the MCP server factory
 * @returns the caller
 * @throws Error when the request skipped the auth gate, which is a wiring bug
 */
export function callerFromAuthInfo(authInfo: AuthInfo | undefined): McpCaller {
  const userId = authInfo?.extra?.userId;
  if (authInfo === undefined || typeof userId !== 'string' || userId === '')
    throw new Error('MCP request reached the server without a verified caller.');
  const clientName = authInfo.extra?.clientName;
  return {
    accessToken: authInfo.token,
    userId,
    clientId: authInfo.clientId === SESSION_TOKEN_CLIENT_ID ? null : authInfo.clientId,
    clientName:
      typeof clientName === 'string' && clientName !== '' ? clientName : UNKNOWN_CLIENT_NAME,
    scopes: authInfo.scopes.filter(isScope),
  };
}

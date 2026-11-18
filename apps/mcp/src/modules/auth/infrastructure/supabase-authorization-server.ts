import {
  type AuthorizationServerMetadata,
  AuthorizationServerMetadataSchema,
} from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { FetchFunction } from '../../../common/http/fetch-function.js';
import type { AuthorizationServer } from '../application/ports/authorization-server.js';

/** Outbound timeout for the metadata request (rule 20-backend: no infinite waits). */
const METADATA_TIMEOUT_MS = 5_000;

/** Metadata changes only when the project's Auth settings change. */
const METADATA_TTL_MS = 10 * 60 * 1000;

/**
 * The RFC 8414 metadata URL of an issuer with a path:
 * `https://ref.supabase.co/auth/v1` →
 * `https://ref.supabase.co/.well-known/oauth-authorization-server/auth/v1`.
 * @param issuer - the issuer identifier
 * @returns where its metadata is published
 */
export function authorizationServerMetadataUrl(issuer: string): URL {
  const url = new URL(issuer);
  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, '');
  return new URL(`/.well-known/oauth-authorization-server${path}`, url.origin);
}

/**
 * Adapter: Supabase Auth as the OAuth 2.1 authorization server. Fetches
 * and caches the project's RFC 8414 metadata, and refuses a document whose
 * issuer is not the configured one (RFC 8414 §3.3). A 404 means the OAuth
 * server is not enabled in the Supabase project; the readiness report says
 * so in plain words.
 */
export class SupabaseAuthorizationServer implements AuthorizationServer {
  private cached: { metadata: AuthorizationServerMetadata; fetchedAt: number } | null = null;
  private pending: Promise<AuthorizationServerMetadata> | null = null;

  /**
   * @param issuer - `<SUPABASE_URL>/auth/v1`
   * @param fetchFunction - the HTTP client, global fetch in production
   * @param now - the clock, injectable for tests
   */
  constructor(
    readonly issuer: string,
    private readonly fetchFunction: FetchFunction = (input, init) => fetch(input, init),
    private readonly now: () => number = Date.now,
  ) {}

  metadata(): Promise<AuthorizationServerMetadata> {
    if (this.cached !== null && this.now() - this.cached.fetchedAt < METADATA_TTL_MS)
      return Promise.resolve(this.cached.metadata);
    this.pending ??= this.fetchMetadata().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async fetchMetadata(): Promise<AuthorizationServerMetadata> {
    const response = await this.request();
    if (response.status === 404)
      throw unusable('The Supabase OAuth 2.1 server is not enabled for this project.');
    if (!response.ok) throw unusable(`Supabase Auth answered ${response.status}.`);
    const parsed = AuthorizationServerMetadataSchema.safeParse(
      await response.json().catch(() => null),
    );
    if (!parsed.success) throw unusable('Supabase Auth returned metadata Deck Club cannot read.');
    if (parsed.data.issuer !== this.issuer)
      throw unusable('Supabase Auth names a different issuer.');
    this.cached = { metadata: parsed.data, fetchedAt: this.now() };
    return parsed.data;
  }

  private async request(): Promise<Response> {
    try {
      return await this.fetchFunction(authorizationServerMetadataUrl(this.issuer), {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(METADATA_TIMEOUT_MS),
      });
    } catch {
      throw unusable('Supabase Auth is not reachable.');
    }
  }
}

const unusable = (detail: string): DeckClubError =>
  new DeckClubError('UPSTREAM_UNAVAILABLE', detail);

import type { VerifiedPrincipal } from '../domain/access-token-claims.js';
import type { AccessTokenVerifier } from '../application/ports/access-token-verifier.js';

/** In-memory {@link AccessTokenVerifier}: knows the tokens it was told to accept. */
export class FakeAccessTokenVerifier implements AccessTokenVerifier {
  private readonly principals = new Map<string, VerifiedPrincipal>();
  private failure: Error | null = null;

  /** Accepts `token` as `principal` from now on. */
  accept(token: string, principal: VerifiedPrincipal): this {
    this.principals.set(token, principal);
    return this;
  }

  /** Makes every verification throw, as when the signing keys are unreachable. */
  failWith(error: Error): void {
    this.failure = error;
  }

  verify(token: string): Promise<VerifiedPrincipal | null> {
    if (this.failure !== null) return Promise.reject(this.failure);
    return Promise.resolve(this.principals.get(token) ?? null);
  }
}

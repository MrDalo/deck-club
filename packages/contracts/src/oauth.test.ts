import { describe, expect, it } from 'vitest';
import { AuthorizationServerMetadataSchema } from './oauth.js';

const SUPABASE_METADATA = {
  issuer: 'https://ref.supabase.co/auth/v1',
  authorization_endpoint: 'https://ref.supabase.co/auth/v1/oauth/authorize',
  token_endpoint: 'https://ref.supabase.co/auth/v1/oauth/token',
  registration_endpoint: 'https://ref.supabase.co/auth/v1/oauth/clients/register',
  jwks_uri: 'https://ref.supabase.co/auth/v1/.well-known/jwks.json',
  response_types_supported: ['code'],
  code_challenge_methods_supported: ['S256'],
};

describe('AuthorizationServerMetadataSchema', () => {
  it('keeps fields it does not model, so the document can be relayed verbatim', () => {
    const parsed = AuthorizationServerMetadataSchema.parse({
      ...SUPABASE_METADATA,
      grant_types_supported: ['authorization_code', 'refresh_token'],
    });

    expect(parsed).toMatchObject({
      grant_types_supported: ['authorization_code', 'refresh_token'],
    });
  });

  it('rejects a document without a token endpoint', () => {
    const { token_endpoint: _omitted, ...incomplete } = SUPABASE_METADATA;

    expect(AuthorizationServerMetadataSchema.safeParse(incomplete).success).toBe(false);
  });
});

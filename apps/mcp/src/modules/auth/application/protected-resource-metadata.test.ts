import { describe, expect, it } from 'vitest';
import {
  buildProtectedResourceMetadata,
  protectedResourceMetadataUrl,
} from './protected-resource-metadata.js';

describe('buildProtectedResourceMetadata', () => {
  const metadata = buildProtectedResourceMetadata({
    resource: new URL('https://mcp.deck.club/mcp'),
    authorizationServer: 'https://ref.supabase.co/auth/v1',
    documentationUrl: new URL('https://deck.club/connect-ai'),
  });

  it('names the MCP endpoint as the resource and Supabase as its authorization server', () => {
    expect(metadata).toMatchObject({
      resource: 'https://mcp.deck.club/mcp',
      authorization_servers: ['https://ref.supabase.co/auth/v1'],
    });
  });

  it('accepts bearer tokens only in the Authorization header', () => {
    expect(metadata.bearer_methods_supported).toEqual(['header']);
  });

  it('links the Connect your AI guide and names the product', () => {
    expect(metadata).toMatchObject({
      resource_name: 'Deck Club',
      resource_documentation: 'https://deck.club/connect-ai',
    });
  });

  it('does not advertise Deck Club scopes the authorization server cannot issue', () => {
    expect(metadata).not.toHaveProperty('scopes_supported');
  });
});

describe('protectedResourceMetadataUrl', () => {
  it('inserts the well-known path before the endpoint path (RFC 9728 §3.1)', () => {
    expect(protectedResourceMetadataUrl(new URL('https://mcp.deck.club/mcp'))).toBe(
      'https://mcp.deck.club/.well-known/oauth-protected-resource/mcp',
    );
  });
});

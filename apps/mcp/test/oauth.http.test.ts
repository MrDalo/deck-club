import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  FAKE_AUTHORIZATION_SERVER_METADATA,
  FAKE_ISSUER,
} from '../src/modules/auth/testing/fake-authorization-server.js';
import {
  postJsonRpc,
  PUBLIC_MCP_URL,
  startTestServer,
  type TestServer,
  TOKENS,
} from './test-app.js';

const METADATA_URL = new URL('/.well-known/oauth-protected-resource/mcp', PUBLIC_MCP_URL).href;
const LIST_TOOLS = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
let server: TestServer;

beforeAll(async () => {
  server = await startTestServer();
});

afterAll(async () => {
  await server.app.close();
});

describe('MCP authorization: the 401 challenge that starts sign-in', () => {
  it('answers a request without a token with 401 and the resource metadata URL', async () => {
    const response = await postJsonRpc(server.endpoint, LIST_TOOLS);

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toMatch(/^Bearer /);
    expect(response.headers.get('www-authenticate')).toContain(
      `resource_metadata="${METADATA_URL}"`,
    );
  });

  it('answers an invalid token with 401 invalid_token', async () => {
    const response = await postJsonRpc(server.endpoint, LIST_TOOLS, {
      authorization: 'Bearer forged',
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain('error="invalid_token"');
    expect(await response.json()).toMatchObject({ error: 'invalid_token' });
  });

  it('does not reveal whether the endpoint exists beyond the challenge', async () => {
    const response = await fetch(server.endpoint, { method: 'GET' });

    expect(response.status).toBe(401);
  });

  it('lets a valid token through', async () => {
    const response = await postJsonRpc(
      server.endpoint,
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { authorization: `Bearer ${TOKENS.ben}` },
    );

    expect(response.status).toBe(202);
  });
});

describe('OAuth discovery documents', () => {
  it.each(['/.well-known/oauth-protected-resource/mcp', '/.well-known/oauth-protected-resource'])(
    'serves the protected resource metadata at %s',
    async (path) => {
      const response = await fetch(new URL(path, server.origin));

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(await response.json()).toEqual({
        resource: 'https://mcp.deck.club/mcp',
        authorization_servers: [FAKE_ISSUER],
        bearer_methods_supported: ['header'],
        resource_name: 'Deck Club',
        resource_documentation: 'https://deck.club/connect-ai',
      });
    },
  );

  it('relays Supabase’s authorization server metadata for older clients', async () => {
    const response = await fetch(new URL('/.well-known/oauth-authorization-server', server.origin));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(FAKE_AUTHORIZATION_SERVER_METADATA);
  });
});

describe('OAuth discovery while Supabase is down', () => {
  let offline: TestServer;

  beforeAll(async () => {
    offline = await startTestServer();
    offline.authorizationServer.goOffline();
  });

  afterAll(async () => {
    await offline.app.close();
  });

  it('answers the authorization server metadata with 503', async () => {
    const response = await fetch(
      new URL('/.well-known/oauth-authorization-server', offline.origin),
    );

    expect(response.status).toBe(503);
  });

  it('still serves the protected resource metadata, which needs no network', async () => {
    const response = await fetch(
      new URL('/.well-known/oauth-protected-resource/mcp', offline.origin),
    );

    expect(response.status).toBe(200);
  });
});

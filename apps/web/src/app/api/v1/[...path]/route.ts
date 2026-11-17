import type { NextRequest } from 'next/server';
import { buildForwardUrl } from '@/shared/api/api-forwarding';
import { serverEnv } from '@/shared/lib/env';
import { createSupabaseServerClient } from '@/shared/supabase/server-client';

/** Outbound timeout to the core API (rule 20-backend: no infinite waits). */
const API_TIMEOUT_MS = 10_000;

type RouteContext = { params: Promise<{ path: string[] }> };

const problem = (status: number, code: string, detail: string): Response =>
  Response.json(
    { type: 'about:blank', title: code, status, code, detail, traceId: '' },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );

/**
 * Backend-for-frontend: the browser calls /api/v1/*, this handler attaches
 * the session's access token and forwards to the core API on the private
 * network. The API itself is never exposed to the internet.
 */
async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const target = buildForwardUrl(serverEnv().API_INTERNAL_URL, path, request.nextUrl.search);
  if (target === null) return problem(404, 'ROUTE_NOT_FOUND', 'No such API route.');

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (accessToken === undefined) return problem(401, 'UNAUTHENTICATED', 'Sign in to continue.');

  const hasBody = request.method !== 'GET' && request.method !== 'DELETE';
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...(hasBody && { 'content-type': 'application/json' }),
      },
      ...(hasBody && { body: await request.text() }),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    const contentType = response.headers.get('content-type');
    return new Response(response.body, {
      status: response.status,
      headers: contentType === null ? {} : { 'content-type': contentType },
    });
  } catch {
    return problem(503, 'UPSTREAM_UNAVAILABLE', 'Deck Club is not reachable right now.');
  }
}

export { forward as DELETE, forward as GET, forward as PATCH, forward as POST };

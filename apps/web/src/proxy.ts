import createMiddleware from 'next-intl/middleware';
import type { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { refreshSupabaseSession } from './shared/supabase/session-proxy';

const handleI18nRouting = createMiddleware(routing);

/** Next 16 proxy: locale negotiation first, then the Supabase session refresh on the same response. */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  return refreshSupabaseSession(request, handleI18nRouting(request));
}

export const config = {
  // Pages only: not the BFF (/api), the auth callbacks (/auth), Next internals or files with an extension.
  matcher: ['/((?!api|auth|_next|_vercel|.*\\..*).*)'],
};

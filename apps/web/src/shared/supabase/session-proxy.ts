import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import { publicEnv } from '../lib/env';

/**
 * Refreshes the Supabase session on every page request and writes the
 * rotated cookies onto the response the i18n proxy produced.
 * @param request - the incoming request
 * @param response - the response next-intl built (rewrite or redirect)
 * @returns the same response with refreshed auth cookies
 */
export async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
): Promise<NextResponse> {
  const env = publicEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );
  // Validates and, when needed, refreshes the token; the result itself is not needed here.
  await supabase.auth.getUser();
  return response;
}

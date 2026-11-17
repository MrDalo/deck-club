import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { publicEnv } from '../lib/env';

/**
 * Supabase client for server components, route handlers and server actions.
 * Writing cookies from a server component throws; the proxy refreshes the
 * session before render, so that write is safe to skip there.
 * @returns a server Supabase client bound to this request's cookies
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  // Read cookies first: it marks the route dynamic before anything else runs at build time.
  const cookieStore = await cookies();
  const env = publicEnv();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options);
          } catch {
            // Called from a server component: the proxy already refreshed the session.
          }
        },
      },
    },
  );
}

/**
 * The signed-in user, verified with Supabase Auth (never trust the cookie alone).
 * @returns the user, or null when signed out
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

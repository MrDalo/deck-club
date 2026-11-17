import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '../lib/env';

/**
 * Supabase client for client components (sign-in, reading the access token
 * for the Connect your AI screen). The session lives in cookies so the
 * server sees the same one.
 * @returns the auth half of a browser Supabase client (the browser never queries tables)
 */
export function createSupabaseBrowserClient(): Pick<SupabaseClient, 'auth'> {
  const env = publicEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

import type { User } from '@supabase/supabase-js';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getCurrentUser } from '@/shared/supabase/server-client';

/**
 * Gate for signed-in pages: sends a signed-out visitor to sign in.
 * @param locale - the page's locale, kept through the redirect
 * @returns the verified user
 */
export async function requireUser(locale: Locale): Promise<User> {
  const user = await getCurrentUser();
  if (user === null) return redirect({ href: '/sign-in', locale });
  return user;
}

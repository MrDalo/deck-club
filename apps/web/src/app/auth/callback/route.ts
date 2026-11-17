import { type NextRequest, NextResponse } from 'next/server';
import { safeRedirectPath } from '@/shared/lib/safe-redirect';
import { createSupabaseServerClient } from '@/shared/supabase/server-client';

/** The magic link lands here: trade the one-time code for a session cookie, then continue. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const next = safeRedirectPath(request.nextUrl.searchParams.get('next'));
  if (code !== null) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error === null) return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }
  return NextResponse.redirect(new URL('/sign-in?error=link', request.nextUrl.origin));
}

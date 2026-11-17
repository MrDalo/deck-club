import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/shared/supabase/server-client';

/** Ends the session (POST only, so a link or prefetch can never sign someone out). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.nextUrl.origin), { status: 303 });
}

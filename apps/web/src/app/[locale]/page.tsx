import { setRequestLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { LandingHero } from '@/features/landing/components/landing-hero';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/shared/supabase/server-client';

type PageProps = { params: Promise<{ locale: string }> };

/** Front page: the pitch when signed out, straight to the decks when signed in. */
export default async function HomePage({ params }: PageProps): Promise<React.JSX.Element> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  if ((await getCurrentUser()) !== null) return redirect({ href: '/decks', locale });
  return <LandingHero />;
}

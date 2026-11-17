import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { DeckLibrary } from '@/features/decks/deck-library/components/deck-library';
import { requireUser } from '../../_auth/require-user';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('decks') };
}

export default async function DecksPage({ params }: PageProps): Promise<React.JSX.Element> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  await requireUser(locale);
  return <DeckLibrary />;
}

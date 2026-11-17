import { setRequestLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { DeckDetail } from '@/features/decks/deck-detail/components/deck-detail';
import { requireUser } from '../../../_auth/require-user';

type PageProps = { params: Promise<{ locale: string; deckId: string }> };

export default async function DeckPage({ params }: PageProps): Promise<React.JSX.Element> {
  const { locale: segment, deckId } = await params;
  const locale = resolveLocale(segment);
  setRequestLocale(locale);
  await requireUser(locale);
  return <DeckDetail deckId={deckId} />;
}

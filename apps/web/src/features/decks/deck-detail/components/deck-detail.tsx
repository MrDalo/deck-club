'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/shared/api/api-client';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { cardListQuery, deckQuery } from '../../data/deck-queries';
import { deckAccent } from '../../lib/deck-accent';
import { useDeleteDeck } from '../hooks/use-delete-deck';
import { CardEditor } from './card-editor';
import { CardRow } from './card-row';

const isNotFound = (error: unknown): boolean =>
  error instanceof ApiError && error.problem.code === 'DECK_NOT_FOUND';

/** The deck page: header, fast card editor and the card list. */
export function DeckDetail({ deckId }: { deckId: string }): React.JSX.Element {
  const t = useTranslations('decks');
  const deck = useQuery(deckQuery(deckId));
  const cards = useQuery(cardListQuery(deckId));
  const deletion = useDeleteDeck(deckId);

  if (deck.isPending) return <p className="text-ink-soft">{t('detail.loading')}</p>;
  if (deck.isError) {
    const message = isNotFound(deck.error) ? t('detail.notFound') : t('detail.loadFailed');
    return <ErrorNotice message={message} error={deck.error} onRetry={() => void deck.refetch()} />;
  }

  return (
    <div className="space-y-10">
      <header>
        <Link href="/decks" className="text-sm font-semibold underline-offset-4 hover:underline">
          {t('detail.back')}
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">
              <span
                className="highlight"
                style={{ '--highlight': deckAccent(deck.data.id).color } as React.CSSProperties}
              >
                {deck.data.title}
              </span>
            </h1>
            {deck.data.description !== '' && (
              <p className="mt-3 max-w-prose text-ink-soft">{deck.data.description}</p>
            )}
            <p className="mt-2 text-sm font-semibold">
              {t('library.cardCount', { count: deck.data.cardCount })}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            disabled={deletion.isPending}
            onClick={() => deletion.remove(t('detail.confirmDelete', { title: deck.data.title }))}
          >
            {t('detail.delete')}
          </Button>
        </div>
        {deletion.error !== null && (
          <ErrorNotice message={t('detail.deleteFailed')} error={deletion.error} />
        )}
      </header>

      <CardEditor deckId={deckId} />

      <section aria-labelledby="cards-title">
        <h2 id="cards-title" className="text-2xl font-bold">
          {t('detail.cardsTitle')}
        </h2>
        <div className="mt-4" aria-busy={cards.isPending}>
          {cards.isError && (
            <ErrorNotice
              message={t('detail.loadFailed')}
              error={cards.error}
              onRetry={() => void cards.refetch()}
            />
          )}
          {cards.data?.length === 0 && <p className="text-ink-soft">{t('detail.emptyCards')}</p>}
          {cards.data !== undefined && cards.data.length > 0 && (
            <ul className="space-y-3">
              {cards.data.map((card) => (
                <CardRow key={card.id} card={card} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

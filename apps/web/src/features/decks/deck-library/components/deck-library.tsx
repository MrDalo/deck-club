'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { deckListQuery } from '../../data/deck-queries';
import { CreateDeckForm } from './create-deck-form';
import { DeckTile } from './deck-tile';

/** The deck library screen: the user's decks beside the create form. */
export function DeckLibrary(): React.JSX.Element {
  const t = useTranslations('decks.library');
  const decks = useQuery(deckListQuery());

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="library-title">
        <h1 id="library-title" className="text-4xl font-extrabold sm:text-5xl">
          <span className="highlight">{t('title')}</span>
        </h1>
        <p className="mt-3 max-w-prose text-ink-soft">{t('lead')}</p>
        <div className="mt-8" aria-live="polite" aria-busy={decks.isPending}>
          {decks.isPending && <p className="text-ink-soft">{t('loading')}</p>}
          {decks.isError && (
            <ErrorNotice
              message={t('loadFailed')}
              error={decks.error}
              onRetry={() => void decks.refetch()}
            />
          )}
          {decks.data?.length === 0 && (
            <div className="rounded-[var(--radius-card)] border-2 border-dashed border-ink/40 p-8 text-center">
              <p className="font-display text-xl font-bold">{t('emptyTitle')}</p>
              <p className="mt-2 text-ink-soft">{t('emptyLead')}</p>
            </div>
          )}
          {decks.data !== undefined && decks.data.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {decks.data.map((deck) => (
                <DeckTile key={deck.id} deck={deck} />
              ))}
            </ul>
          )}
        </div>
      </section>
      <aside>
        <CreateDeckForm />
      </aside>
    </div>
  );
}

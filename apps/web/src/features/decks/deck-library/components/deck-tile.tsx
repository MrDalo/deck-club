import type { Deck } from '@deck-club/contracts';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/lib/cn';
import { deckAccent } from '../../lib/deck-accent';

/** One deck in the library: an index card with a coloured tab, title and card count. */
export function DeckTile({ deck }: { deck: Deck }): React.JSX.Element {
  const t = useTranslations('decks.library');
  return (
    <li>
      <Link
        href={`/decks/${deck.id}`}
        className="group block h-full rounded-[var(--radius-card)] border-2 border-ink bg-card shadow-sticker-sm transition-transform hover:-translate-y-0.5 hover:rotate-[-0.6deg]"
      >
        <span
          aria-hidden="true"
          className={cn(
            'block h-3 rounded-t-[calc(var(--radius-card)-2px)] border-b-2 border-ink',
            deckAccent(deck.id).className,
          )}
        />
        <span className="block p-4">
          <span className="block font-display text-lg leading-snug font-bold group-hover:underline">
            {deck.title}
          </span>
          {deck.description !== '' && (
            <span className="mt-1 line-clamp-2 block text-sm text-ink-soft">
              {deck.description}
            </span>
          )}
          <span className="mt-3 flex items-center gap-2 text-sm">
            <span className="rounded-full bg-paper px-2.5 py-0.5 font-semibold uppercase">
              {deck.language}
            </span>
            <span>{t('cardCount', { count: deck.cardCount })}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

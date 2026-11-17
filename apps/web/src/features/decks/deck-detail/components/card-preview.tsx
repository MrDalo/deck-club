import { useTranslations } from 'next-intl';

type CardPreviewProps = {
  front: string;
  back: string;
};

/** Live preview of the card being written: the two sides as ruled index cards (product spec 4.2). */
export function CardPreview({ front, back }: CardPreviewProps): React.JSX.Element {
  const t = useTranslations('decks.editor');
  return (
    <figure aria-label={t('previewLabel')} className="grid gap-3 sm:grid-cols-2">
      <div className="ruled flex min-h-36 flex-col rounded-2xl border-2 border-ink p-4 pt-3 shadow-sticker-sm sm:rotate-[-1.2deg]">
        <span className="h-8 text-xs font-semibold text-ink-soft">{t('previewFront')}</span>
        <p className="mt-3 font-display text-lg leading-8 font-bold break-words whitespace-pre-wrap">
          {front}
        </p>
      </div>
      <div className="ruled flex min-h-36 flex-col rounded-2xl border-2 border-ink p-4 pt-3 shadow-sticker-sm sm:rotate-[0.8deg]">
        <span className="h-8 text-xs font-semibold text-ink-soft">{t('previewBack')}</span>
        <p className="mt-3 leading-8 break-words whitespace-pre-wrap">{back}</p>
      </div>
    </figure>
  );
}

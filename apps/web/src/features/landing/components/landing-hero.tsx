import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/shared/ui/button';

const POINT_KEYS = ['free', 'ai', 'schedule'] as const;
const POINT_ACCENTS = ['bg-mint', 'bg-lilac', 'bg-peach'] as const;

/**
 * The signed-out front page. Its one bold moment is the sample flashcard:
 * a real card, front and back, with the "Added by Claude" badge that is the
 * product's whole idea in one glance.
 */
export async function LandingHero(): Promise<React.JSX.Element> {
  const t = await getTranslations('landing');

  return (
    <div className="grid items-center gap-12 py-4 lg:grid-cols-[1.1fr_1fr] lg:py-10">
      <div>
        <h1 className="text-5xl font-extrabold sm:text-6xl lg:text-7xl">
          <span className="highlight">{t('title')}</span>
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg text-ink-soft sm:text-xl">{t('lead')}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">{t('start')}</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/connect-ai">{t('connect')}</Link>
          </Button>
        </div>
        <ul className="mt-10 space-y-3">
          {POINT_KEYS.map((key, index) => (
            <li key={key} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-ink ${POINT_ACCENTS[index] ?? 'bg-lilac'}`}
              />
              <span>{t(`points.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div aria-hidden="true" className="relative mx-auto h-80 w-full max-w-sm sm:h-96">
        {/* The answer sits behind and peeks out below; the question card lies on top. */}
        <div className="absolute inset-x-0 top-28 flex h-52 rotate-[4deg] flex-col justify-end gap-3 rounded-[var(--radius-card)] border-2 border-ink bg-sky p-5 shadow-sticker">
          <p className="text-lg leading-7">{t('sampleBack')}</p>
          <span className="self-start rounded-full border-2 border-ink bg-mint px-3 py-1 text-sm font-semibold">
            {t('sampleBadge')}
          </span>
        </div>
        <div className="ruled absolute inset-x-6 top-0 h-48 rotate-[-5deg] rounded-[var(--radius-card)] border-2 border-ink p-5 pt-3 shadow-sticker">
          <span className="block h-8" />
          <p className="font-display text-2xl leading-8 font-bold">{t('sampleFront')}</p>
        </div>
      </div>
    </div>
  );
}

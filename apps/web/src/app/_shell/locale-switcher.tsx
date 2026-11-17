'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { type Locale, routing } from '@/i18n/routing';

/** Switches the UI language and keeps the current page. */
export function LocaleSwitcher(): React.JSX.Element {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const switchTo = (next: Locale): void => {
    // Dynamic segments come back as params; next-intl re-applies them for the new locale.
    router.replace({ pathname, params } as Parameters<typeof router.replace>[0], { locale: next });
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t('nav.language')}</span>
      <select
        value={locale}
        onChange={(event) => switchTo(event.target.value as Locale)}
        className="h-9 rounded-full border-2 border-ink/80 bg-card px-3 text-sm font-semibold"
      >
        {routing.locales.map((option) => (
          <option key={option} value={option}>
            {t(`locales.${option}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

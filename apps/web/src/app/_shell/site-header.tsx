import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getCurrentUser } from '@/shared/supabase/server-client';
import { Button } from '@/shared/ui/button';
import { LogoMark } from '@/shared/ui/logo';
import { LocaleSwitcher } from './locale-switcher';

/** Top bar: wordmark, the two main destinations when signed in, language, and sign in or out. */
export async function SiteHeader(): Promise<React.JSX.Element> {
  const t = await getTranslations();
  const user = await getCurrentUser();

  return (
    <header className="border-b-2 border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link
          href={user === null ? '/' : '/decks'}
          className="flex items-center gap-2 rounded-lg font-display text-xl font-extrabold"
        >
          <LogoMark />
          {t('brand.name')}
        </Link>
        {user !== null && (
          <nav
            aria-label={t('nav.mainLabel')}
            className="order-3 flex w-full gap-1 sm:order-none sm:w-auto"
          >
            <Button asChild variant="ghost" size="sm">
              <Link href="/decks">{t('nav.decks')}</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/connect-ai">{t('nav.connectAi')}</Link>
            </Button>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3">
          <LocaleSwitcher />
          {user === null ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/sign-in">{t('nav.signIn')}</Link>
            </Button>
          ) : (
            <form action="/auth/sign-out" method="post">
              <Button type="submit" variant="secondary" size="sm">
                {t('nav.signOut')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

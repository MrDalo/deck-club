import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { SignInForm } from '@/features/auth/sign-in/components/sign-in-form';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/shared/supabase/server-client';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('signIn') };
}

export default async function SignInPage({
  params,
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  if ((await getCurrentUser()) !== null) return redirect({ href: '/decks', locale });
  const t = await getTranslations('auth.signIn');
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-4xl font-extrabold">
        <span className="highlight">{t('title')}</span>
      </h1>
      <p className="mt-3 text-ink-soft">{t('lead')}</p>
      <div className="mt-8">
        <SignInForm linkExpired={error === 'link'} />
      </div>
    </div>
  );
}

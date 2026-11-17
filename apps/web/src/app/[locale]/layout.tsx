import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from 'next/font/google';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { QueryProvider } from '../_providers/query-provider';
import { SiteHeader } from '../_shell/site-header';
import '../globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-bricolage',
  display: 'swap',
});
const body = Atkinson_Hyperlegible({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, 'children'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
  });
  return {
    title: { default: t('brand.name'), template: `%s · ${t('brand.name')}` },
    description: t('brand.description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps): Promise<React.JSX.Element> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only rounded-full bg-butter px-4 py-2 font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          {t('nav.skipToContent')}
        </a>
        <NextIntlClientProvider>
          <QueryProvider>
            <SiteHeader />
            <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
              {children}
            </main>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

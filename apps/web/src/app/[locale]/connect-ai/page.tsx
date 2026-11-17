import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { ConnectAiGuide } from '@/features/connect-ai/components/connect-ai-guide';
import { publicEnv } from '@/shared/lib/env';
import { requireUser } from '../../_auth/require-user';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('nav');
  return { title: t('connectAi') };
}

export default async function ConnectAiPage({ params }: PageProps): Promise<React.JSX.Element> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  await requireUser(locale);
  return <ConnectAiGuide mcpUrl={publicEnv().NEXT_PUBLIC_MCP_URL} />;
}

'use client';

import { useTranslations } from 'next-intl';
import { useCopyToClipboard } from '@/shared/lib/use-copy-to-clipboard';
import { Button } from '@/shared/ui/button';
import { useAccessTokenCopy } from '../hooks/use-access-token-copy';
import { claudeCodeCommand } from '../lib/claude-code-command';

const EXAMPLE_KEYS = ['make', 'list', 'add'] as const;

/** The Connect your AI screen (product spec 4.1, 5): server URL, token, per-client steps, example prompts. */
export function ConnectAiGuide({ mcpUrl }: { mcpUrl: string }): React.JSX.Element {
  const t = useTranslations('connectAi');
  const urlCopy = useCopyToClipboard();
  const tokenCopy = useAccessTokenCopy();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          <span
            className="highlight"
            style={{ '--highlight': 'var(--color-mint)' } as React.CSSProperties}
          >
            {t('title')}
          </span>
        </h1>
        <p className="mt-4 max-w-prose text-lg text-ink-soft">{t('lead')}</p>
      </header>

      <section
        aria-labelledby="server-url-title"
        className="rounded-[var(--radius-card)] border-2 border-ink bg-card p-5 shadow-sticker"
      >
        <h2 id="server-url-title" className="text-xl font-bold">
          {t('serverUrl')}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-xl bg-paper px-3 py-2 text-sm break-all">{mcpUrl}</code>
          <Button variant="secondary" size="sm" onClick={() => void urlCopy.copy(mcpUrl)}>
            {urlCopy.hasCopied ? t('copied') : t('copy')}
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="token-title"
        className="rounded-[var(--radius-card)] border-2 border-ink bg-butter/50 p-5"
      >
        <h2 id="token-title" className="text-xl font-bold">
          {t('tokenTitle')}
        </h2>
        <p className="mt-2 max-w-prose">{t('tokenLead')}</p>
        <Button size="sm" className="mt-4" onClick={() => void tokenCopy.copyToken()}>
          {tokenCopy.hasCopied ? t('copied') : t('copyToken')}
        </Button>
        {tokenCopy.hasFailed && (
          <p role="alert" className="mt-2 text-sm font-semibold">
            {t('tokenFailed')}
          </p>
        )}
      </section>

      <ConnectAiSteps mcpUrl={mcpUrl} />
    </div>
  );
}

/** Per-client setup steps and example prompts. */
function ConnectAiSteps({ mcpUrl }: { mcpUrl: string }): React.JSX.Element {
  const t = useTranslations('connectAi');
  return (
    <>
      <section aria-labelledby="clients-title">
        <h2 id="clients-title" className="text-2xl font-bold">
          {t('clientsTitle')}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-ink/80 bg-card p-4">
            <h3 className="text-lg font-bold">{t('claudeCode')}</h3>
            <p className="mt-1 text-sm">{t('claudeCodeStep')}</p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-3 text-sm text-paper">
              <code>{claudeCodeCommand(mcpUrl)}</code>
            </pre>
          </div>
          <div className="rounded-2xl border-2 border-ink/80 bg-card p-4">
            <h3 className="text-lg font-bold">{t('otherClients')}</h3>
            <p className="mt-1 text-sm">{t('otherClientsStep')}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="examples-title">
        <h2 id="examples-title" className="text-2xl font-bold">
          {t('examplesTitle')}
        </h2>
        <ul className="mt-4 space-y-2">
          {EXAMPLE_KEYS.map((key) => (
            <li key={key} className="rounded-2xl bg-lilac/40 px-4 py-3">
              {t(`examples.${key}`)}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

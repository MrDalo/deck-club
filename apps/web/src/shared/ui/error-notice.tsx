'use client';

import { useTranslations } from 'next-intl';
import { ApiError } from '../api/api-client';
import { Button } from './button';

type ErrorNoticeProps = {
  /** What failed, already translated. */
  message: string;
  /** The error, for its trace reference. */
  error: unknown;
  /** Offered for transient failures only. */
  onRetry?: () => void;
};

/** An inline failure with a retry for transient errors and the trace reference for support (rule 30-web). */
export function ErrorNotice({ message, error, onRetry }: ErrorNoticeProps): React.JSX.Element {
  const t = useTranslations('errors');
  const traceId = error instanceof ApiError ? error.problem.traceId : '';
  const canRetry = onRetry !== undefined && (!(error instanceof ApiError) || error.isTransient);

  return (
    <div role="alert" className="rounded-2xl border-2 border-ink/80 bg-rose/40 px-4 py-3">
      <p className="font-semibold">{message}</p>
      {traceId !== '' && (
        <p className="mt-1 text-sm text-ink-soft">{t('reference', { traceId })}</p>
      )}
      {canRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          {t('retry')}
        </Button>
      )}
    </div>
  );
}

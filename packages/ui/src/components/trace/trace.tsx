'use client';

import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react';
import { createContext, useContext, type ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { formatDuration } from './format-duration.js';

/** Where a step is: not started, under way, finished or failed. */
export type TraceStatus = 'pending' | 'running' | 'done' | 'error';

/** Each status in words, translated: read out with every step. */
export type TraceStatusLabels = Record<TraceStatus, string>;

type TraceContextValue = { statusLabels: TraceStatusLabels; locale: string | undefined };

const TraceContext = createContext<TraceContextValue | null>(null);

function useTrace(): TraceContextValue {
  const context = useContext(TraceContext);
  if (context === null) throw new Error('TraceStep must be used within a Trace.');
  return context;
}

export type TraceProps = ComponentProps<'ol'> & {
  /** What the steps are, translated: "What Claude did", "Import progress". */
  label: string;
  /** The statuses in words, translated, e.g. { done: "Done", error: "Failed", … }. */
  statusLabels: TraceStatusLabels;
  /** A BCP 47 tag for the durations; the runtime's by default. */
  locale?: string;
};

/**
 * The steps of a piece of work, in order, each with its status: what the AI
 * assistant did to answer (read a deck, wrote cards), or the stages of an
 * import. Put TraceSteps inside. The status is carried by the icon's shape
 * and colour and read out in words.
 */
export function Trace({
  label,
  statusLabels,
  locale,
  className,
  ...props
}: TraceProps): React.JSX.Element {
  return (
    <TraceContext.Provider value={{ statusLabels, locale }}>
      <ol
        data-slot="trace"
        aria-label={label}
        className={cn('grid text-ink', className)}
        {...props}
      />
    </TraceContext.Provider>
  );
}

const BADGE: Record<TraceStatus, string> = {
  pending: 'border-dashed border-ink-soft bg-card text-ink-soft',
  running: 'border-ink bg-sky text-ink',
  done: 'border-ink bg-mint text-ink',
  error: 'border-ink bg-rose text-ink',
};

function StatusIcon({ status }: { status: TraceStatus }): React.JSX.Element | null {
  switch (status) {
    case 'running':
      return <Loader2Icon aria-hidden className="size-3.5 motion-safe:animate-spin" />;
    case 'done':
      return <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />;
    case 'error':
      return <XIcon aria-hidden className="size-3.5" strokeWidth={3} />;
    default:
      return null;
  }
}

export type TraceStepProps = Omit<ComponentProps<'li'>, 'title'> & {
  status: TraceStatus;
  /** What the step does, translated: "Read your deck Biology 101". */
  title: React.ReactNode;
  /** A line of detail under the title: "48 cards", the error's message. */
  detail?: React.ReactNode;
  /** How long it took, in milliseconds; formatted in the Trace's locale. */
  duration?: number;
};

/**
 * One step of a Trace. The step under way is the current one
 * (`aria-current="step"`). Anything more, such as the tool's input behind a
 * Collapsible, goes in as children.
 */
export function TraceStep({
  status,
  title,
  detail,
  duration,
  className,
  children,
  ...props
}: TraceStepProps): React.JSX.Element {
  const { statusLabels, locale } = useTrace();

  return (
    <li
      data-slot="trace-step"
      data-status={status}
      aria-current={status === 'running' ? 'step' : undefined}
      className={cn('group/trace-step relative grid grid-cols-[1.5rem_1fr] gap-x-3', className)}
      {...props}
    >
      <span
        aria-hidden
        className="absolute top-7 bottom-0 left-[calc(0.75rem-1px)] w-0.5 bg-ink/20 group-last/trace-step:hidden"
      />
      <span
        className={cn(
          'relative mt-0.5 grid size-6 place-items-center rounded-full border-2',
          BADGE[status],
        )}
      >
        <StatusIcon status={status} />
      </span>
      <div className="min-w-0 pb-5 group-last/trace-step:pb-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={cn('font-semibold', status === 'pending' && 'font-medium text-ink-soft')}>
            <span className="sr-only">{statusLabels[status]}: </span>
            {title}
          </p>
          {duration !== undefined && (
            <span className="text-xs text-ink-soft tabular-nums">
              {formatDuration(duration, locale)}
            </span>
          )}
        </div>
        {detail !== undefined && (
          <p
            className={cn(
              'mt-0.5 text-sm text-ink-soft',
              status === 'error' && 'font-medium text-danger',
            )}
          >
            {detail}
          </p>
        )}
        {children !== undefined && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

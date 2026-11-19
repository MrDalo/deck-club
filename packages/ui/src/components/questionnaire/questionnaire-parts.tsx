import { CheckIcon, XIcon } from 'lucide-react';
import { cn } from '#lib/utils';
import { Button } from '#components/button';
import { Progress } from '#components/progress';

/** "Question 2 of 5" over a bar. */
export function QuestionnaireProgress({
  id,
  text,
  current,
  total,
}: {
  id: string;
  text: string;
  current: number;
  total: number;
}): React.JSX.Element {
  return (
    <div className="grid gap-2">
      <p id={id} className="text-sm font-semibold text-ink-soft">
        {text}
      </p>
      <Progress value={(current / total) * 100} aria-labelledby={id} size="sm" />
    </div>
  );
}

/** The verdict on a checked answer, with the explanation. */
function Result({
  grade,
  verdict,
  explanation,
}: {
  grade: 'correct' | 'incorrect';
  verdict: string;
  explanation: string | undefined;
}): React.JSX.Element {
  return (
    <div
      data-slot="questionnaire-result"
      data-grade={grade}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 border-ink px-4 py-3',
        grade === 'correct' ? 'bg-mint' : 'bg-rose/60',
      )}
    >
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink bg-card">
        {grade === 'correct' ? (
          <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />
        ) : (
          <XIcon aria-hidden className="size-3.5" strokeWidth={3} />
        )}
      </span>
      <div className="grid gap-0.5">
        <p className="font-semibold">{verdict}</p>
        {explanation !== undefined && <p className="text-sm">{explanation}</p>}
      </div>
    </div>
  );
}

/** The question as the step's heading (focusable, for moving to it), with its hint. */
export function QuestionnaireHeading({
  ref,
  level,
  id,
  descriptionId,
  prompt,
  description,
}: {
  ref: React.Ref<HTMLHeadingElement>;
  level: 2 | 3 | 4;
  id: string;
  descriptionId: string;
  prompt: string;
  description: string | undefined;
}): React.JSX.Element {
  const Heading = `h${level}` as const;
  return (
    <div className="grid gap-1">
      <Heading
        ref={ref}
        id={id}
        tabIndex={-1}
        className="font-display text-xl font-semibold text-balance outline-none"
      >
        {prompt}
      </Heading>
      {description !== undefined && (
        <p id={descriptionId} className="text-sm text-ink-soft">
          {description}
        </p>
      )}
    </div>
  );
}

/** Back (from the second question on) and the primary action, which submits. */
export function QuestionnaireNav({
  backLabel,
  actionLabel,
  onBack,
}: {
  backLabel: string;
  actionLabel: string;
  onBack: (() => void) | undefined;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {onBack === undefined ? (
        <span />
      ) : (
        <Button variant="secondary" onClick={onBack}>
          {backLabel}
        </Button>
      )}
      <Button type="submit">{actionLabel}</Button>
    </div>
  );
}

/**
 * The missing-answer error (an alert) and, once an answer is checked, its
 * verdict in a status region that is always present, so it is announced.
 */
export function QuestionnaireFeedback({
  errorId,
  error,
  grade,
  verdict,
  explanation,
}: {
  errorId: string;
  error: string | undefined;
  grade: 'correct' | 'incorrect' | undefined;
  verdict: string | undefined;
  explanation: string | undefined;
}): React.JSX.Element {
  return (
    <>
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div role="status">
        {grade !== undefined && verdict !== undefined && (
          <Result grade={grade} verdict={verdict} explanation={explanation} />
        )}
      </div>
    </>
  );
}

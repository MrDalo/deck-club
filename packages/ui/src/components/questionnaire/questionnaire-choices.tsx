'use client';

import { CheckIcon, XIcon } from 'lucide-react';
import { useId } from 'react';
import { cn } from '#lib/utils';
import { Checkbox } from '#components/checkbox';
import { RadioGroup, RadioGroupItem } from '#components/radio-group';
import { optionOutcome } from './grade.js';
import type {
  OptionOutcome,
  QuestionnaireFeedbackLabels,
  QuestionnaireOption,
  QuestionnaireQuestion,
} from './types.js';

type ChoicesProps = {
  question: QuestionnaireQuestion;
  answer: readonly string[];
  onAnswerChange: (answer: string[]) => void;
  /** Checked: the answer is shown graded and can no longer change. */
  locked: boolean;
  invalid: boolean;
  labelledBy: string;
  describedBy: string | undefined;
  feedbackLabels: QuestionnaireFeedbackLabels | undefined;
};

/** The card around each answer; its fill follows the choice, then the outcome. */
const CARD = [
  'flex cursor-pointer items-start gap-3 rounded-xl border-2 border-ink/80 bg-card px-4 py-3 text-ink transition-colors',
  'hover:bg-paper has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:bg-lilac/40',
  'data-[outcome=correct]:!bg-mint data-[outcome=missed]:border-dashed data-[outcome=missed]:!bg-mint/40',
  'data-[outcome=incorrect]:!bg-rose/60 data-[locked=true]:cursor-default',
];

const MARK: Record<Exclude<OptionOutcome, 'neutral'>, React.JSX.Element> = {
  correct: <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />,
  missed: <CheckIcon aria-hidden className="size-3.5" strokeWidth={3} />,
  incorrect: <XIcon aria-hidden className="size-3.5" strokeWidth={3} />,
};

function Choice({
  option,
  control,
  outcome,
  locked,
  feedbackLabels,
  baseId,
}: {
  option: QuestionnaireOption;
  control: (ids: {
    id: string;
    labelledBy: string;
    describedBy: string | undefined;
  }) => React.ReactNode;
  outcome: OptionOutcome;
  locked: boolean;
  feedbackLabels: QuestionnaireFeedbackLabels | undefined;
  baseId: string;
}): React.JSX.Element {
  const id = `${baseId}-${option.value}`;
  const showOutcome = locked && outcome !== 'neutral' && feedbackLabels !== undefined;
  const describedBy =
    [
      option.description === undefined ? undefined : `${id}-description`,
      showOutcome ? `${id}-outcome` : undefined,
    ]
      .filter((part) => part !== undefined)
      .join(' ') || undefined;

  return (
    <label
      htmlFor={id}
      data-slot="questionnaire-choice"
      data-outcome={locked ? outcome : undefined}
      data-locked={locked}
      className={cn(CARD)}
    >
      {control({ id, labelledBy: `${id}-label`, describedBy })}
      <span className="grid flex-1 gap-0.5">
        <span id={`${id}-label`} className="font-semibold">
          {option.label}
        </span>
        {option.description !== undefined && (
          <span id={`${id}-description`} className="text-sm text-ink-soft">
            {option.description}
          </span>
        )}
      </span>
      {showOutcome && (
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="grid size-6 place-items-center rounded-full border-2 border-ink bg-card">
            {MARK[outcome]}
          </span>
          <span id={`${id}-outcome`} className="sr-only">
            {feedbackLabels[outcome]}
          </span>
        </span>
      )}
    </label>
  );
}

function SingleChoices({
  question,
  answer,
  onAnswerChange,
  locked,
  invalid,
  labelledBy,
  describedBy,
  feedbackLabels,
}: ChoicesProps): React.JSX.Element {
  const baseId = useId();
  return (
    <RadioGroup
      value={answer[0] ?? ''}
      onValueChange={(value) => {
        if (!locked) onAnswerChange([value]);
      }}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-readonly={locked || undefined}
      aria-required={question.optional === true ? undefined : true}
      className="gap-2.5"
    >
      {question.options.map((option) => (
        <Choice
          key={option.value}
          option={option}
          outcome={optionOutcome(question, answer, option.value)}
          locked={locked}
          feedbackLabels={feedbackLabels}
          baseId={baseId}
          control={(ids) => (
            <RadioGroupItem
              value={option.value}
              id={ids.id}
              aria-labelledby={ids.labelledBy}
              aria-describedby={ids.describedBy}
              aria-invalid={invalid || undefined}
              className="mt-0.5"
            />
          )}
        />
      ))}
    </RadioGroup>
  );
}

function MultipleChoices({
  question,
  answer,
  onAnswerChange,
  locked,
  invalid,
  labelledBy,
  describedBy,
  feedbackLabels,
}: ChoicesProps): React.JSX.Element {
  const baseId = useId();
  const toggle = (value: string, on: boolean): void => {
    if (locked) return;
    const chosen = new Set(answer);
    if (on) chosen.add(value);
    else chosen.delete(value);
    // In the order the options are shown, whatever the order of clicks.
    onAnswerChange(
      question.options.map((option) => option.value).filter((value) => chosen.has(value)),
    );
  };

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      className="grid gap-2.5"
    >
      {question.options.map((option) => (
        <Choice
          key={option.value}
          option={option}
          outcome={optionOutcome(question, answer, option.value)}
          locked={locked}
          feedbackLabels={feedbackLabels}
          baseId={baseId}
          control={(ids) => (
            <Checkbox
              id={ids.id}
              checked={answer.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked === true)}
              aria-labelledby={ids.labelledBy}
              aria-describedby={ids.describedBy}
              aria-invalid={invalid || undefined}
              aria-readonly={locked || undefined}
              className="mt-0.5"
            />
          )}
        />
      ))}
    </div>
  );
}

/**
 * A question's answers as cards: radio buttons for one answer, checkboxes for
 * several. Once checked they stay reachable, read-only, to review.
 */
export function QuestionnaireChoices(props: ChoicesProps): React.JSX.Element {
  return props.question.kind === 'single' ? (
    <SingleChoices {...props} />
  ) : (
    <MultipleChoices {...props} />
  );
}

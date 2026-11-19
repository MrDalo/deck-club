'use client';

import { useId } from 'react';
import { cn } from '#lib/utils';
import { QuestionnaireChoices } from './questionnaire-choices.js';
import {
  QuestionnaireHeading,
  QuestionnaireNav,
  QuestionnaireFeedback,
  QuestionnaireProgress,
} from './questionnaire-parts.js';
import type {
  QuestionnaireProps,
  QuestionnaireQuestion,
  QuestionnaireQuizLabels,
} from './types.js';
import { useFocusOnStepChange, useQuestionnaire } from './use-questionnaire.js';

function assertUsable(
  questions: readonly QuestionnaireQuestion[],
  quizLabels: QuestionnaireQuizLabels | undefined,
): void {
  if (questions.length === 0) throw new Error('Questionnaire needs at least one question.');
  if (quizLabels === undefined && questions.some((question) => question.correct !== undefined)) {
    throw new Error('Questionnaire needs quizLabels for questions with a correct answer.');
  }
}

const joinIds = (...ids: (string | false)[]): string | undefined =>
  ids.filter((part) => part !== false).join(' ') || undefined;

/**
 * Questions one at a time, with progress, Back and Next: a quick quiz on a
 * deck, or the questions an AI assistant asks before it writes your cards.
 * Questions with a `correct` answer are graded: Check shows what was right
 * (in words too, not only in colour) before moving on. Moving to another
 * question puts the focus on its heading.
 */
export function Questionnaire({
  label,
  labels,
  quizLabels,
  headingLevel = 2,
  className,
  ...rest
}: QuestionnaireProps): React.JSX.Element {
  assertUsable(rest.questions, quizLabels);
  const { formProps, ...state } = useQuestionnaire(rest);
  const { question } = state;
  const headingRef = useFocusOnStepChange(state.current);
  const id = useId();

  return (
    <form
      data-slot="questionnaire"
      aria-label={label}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        state.advance();
      }}
      className={cn(
        'grid gap-5 rounded-card border-2 border-ink bg-card p-5 text-ink shadow-sticker sm:p-6',
        className,
      )}
      {...formProps}
    >
      <QuestionnaireProgress
        id={`${id}-progress`}
        text={labels.progress(state.current + 1, state.total)}
        current={state.current + 1}
        total={state.total}
      />
      <QuestionnaireHeading
        ref={headingRef}
        level={headingLevel}
        id={`${id}-question`}
        descriptionId={`${id}-description`}
        prompt={question.prompt}
        description={question.description}
      />
      <QuestionnaireChoices
        key={question.id}
        question={question}
        answer={state.answer}
        onAnswerChange={state.answerWith}
        locked={state.locked}
        invalid={state.missingAnswer}
        labelledBy={`${id}-question`}
        describedBy={joinIds(
          question.description !== undefined && `${id}-description`,
          state.missingAnswer && `${id}-error`,
        )}
        feedbackLabels={quizLabels}
      />
      <QuestionnaireFeedback
        errorId={`${id}-error`}
        error={state.missingAnswer ? labels.required : undefined}
        grade={state.grade}
        verdict={state.grade === undefined ? undefined : quizLabels?.[state.grade]}
        explanation={question.explanation}
      />
      <QuestionnaireNav
        backLabel={labels.back}
        actionLabel={
          { check: quizLabels?.check, next: labels.next, finish: labels.finish }[state.action] ??
          labels.next
        }
        onBack={state.current > 0 ? state.back : undefined}
      />
    </form>
  );
}

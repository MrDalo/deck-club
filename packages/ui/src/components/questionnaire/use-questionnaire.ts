'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useControllableState } from '#lib/use-controllable-state';
import { gradeAnswer, isAnswered } from './grade.js';
import type { QuestionnaireProps, QuestionnaireQuestion } from './types.js';

/** The props the state takes; the rest go to the form. */
type Options = Omit<
  QuestionnaireProps,
  'label' | 'labels' | 'quizLabels' | 'headingLevel' | 'className'
>;

/** What the primary button does next. */
type QuestionnaireAction = 'check' | 'next' | 'finish';

/**
 * The questionnaire's state: answers and step (each controlled or not), the
 * checked questions and the missing-answer error.
 * @param options - the questions, the state props and the completion handler; the rest are the form's
 * @returns the current question with its answer, the handlers and the form's own props
 */
export function useQuestionnaire({
  questions,
  value,
  defaultValue = {},
  onValueChange,
  step,
  defaultStep = 0,
  onStepChange,
  onComplete,
  ...formProps
}: Options) {
  const [answers, setAnswers] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const [rawStep, setStep] = useControllableState({
    value: step,
    defaultValue: defaultStep,
    onChange: onStepChange,
  });
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [missingAnswer, setMissingAnswer] = useState(false);

  const current = Math.min(Math.max(rawStep, 0), questions.length - 1);
  // The clamp above keeps the index in range.
  const question = questions[current] as QuestionnaireQuestion;
  const answer = answers[question.id] ?? [];
  const locked = checked.has(question.id);
  const isLast = current === questions.length - 1;
  // A graded question is checked before moving on; an optional one left blank is skipped.
  const needsCheck =
    question.correct !== undefined && !locked && (isAnswered(answer) || question.optional !== true);
  let action: QuestionnaireAction = isLast ? 'finish' : 'next';
  if (needsCheck) action = 'check';

  const goTo = (next: number): void => {
    setMissingAnswer(false);
    setStep(next);
  };

  return {
    formProps,
    total: questions.length,
    current,
    question,
    answer,
    locked,
    grade: locked ? gradeAnswer(question, answer) : undefined,
    action,
    missingAnswer,
    back: (): void => goTo(current - 1),
    answerWith: (next: string[]): void => {
      setMissingAnswer(false);
      setAnswers({ ...answers, [question.id]: next });
    },
    advance: (): void => {
      if (question.optional !== true && !isAnswered(answer)) setMissingAnswer(true);
      else if (action === 'check') setChecked(new Set(checked).add(question.id));
      else if (action === 'finish') onComplete(answers);
      else goTo(current + 1);
    },
  };
}

/**
 * Focus the returned element whenever the step changes (not on the first
 * render), so a new question's heading is read out next.
 * @param step - the step shown
 * @returns the ref for the heading
 */
export function useFocusOnStepChange(step: number): RefObject<HTMLHeadingElement | null> {
  const ref = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    ref.current?.focus();
  }, [step]);
  return ref;
}

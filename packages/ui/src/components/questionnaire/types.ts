import type { ComponentProps } from 'react';

/** One answer to choose from. */
export type QuestionnaireOption = {
  /** Stable and unique within its question; what the answers record. */
  value: string;
  /** The answer as shown, translated. */
  label: string;
  /** A line under the label. */
  description?: string;
};

/** One question: pick one answer (`single`) or any number (`multiple`). */
export type QuestionnaireQuestion = {
  /** Stable and unique within the questionnaire; keys the answers. */
  id: string;
  /** The question, translated. Shown as the step's heading. */
  prompt: string;
  /** A hint under the question. */
  description?: string;
  kind: 'single' | 'multiple';
  options: readonly QuestionnaireOption[];
  /** May be skipped. Questions need an answer by default. */
  optional?: boolean;
  /**
   * The right answer's values. Given, the question is graded: the reader
   * checks their answer and sees what was right before moving on.
   */
  correct?: readonly string[];
  /** Why the right answer is right, shown once the answer is checked. */
  explanation?: string;
};

/** The chosen values per question id. */
export type QuestionnaireAnswers = Readonly<Record<string, readonly string[]>>;

/** How one answer fared once checked. */
export type OptionOutcome = 'correct' | 'incorrect' | 'missed' | 'neutral';

/** Each outcome in words, translated; read out with the option once checked. */
export type QuestionnaireFeedbackLabels = {
  /** The reader chose it, and it is right: "Correct". */
  correct: string;
  /** The reader chose it, and it is wrong: "Not quite". */
  incorrect: string;
  /** The reader did not choose it, but it is right: "The right answer". */
  missed: string;
};

/** The questionnaire's words, translated. */
export type QuestionnaireLabels = {
  back: string;
  next: string;
  /** On the last question: "Finish", "Send answers". */
  finish: string;
  /** Where the reader is: (2, 5) → "Question 2 of 5". */
  progress: (current: number, total: number) => string;
  /** Shown when moving on without answering a required question. */
  required: string;
};

/** The words for graded questions, translated. */
export type QuestionnaireQuizLabels = QuestionnaireFeedbackLabels & {
  /** The button that grades the answer: "Check". */
  check: string;
};

export type QuestionnaireProps = Omit<
  ComponentProps<'form'>,
  'onSubmit' | 'onChange' | 'defaultValue' | 'children'
> & {
  /** What it is, translated: "Quick check: the cell cycle". Names the form. */
  label: string;
  questions: readonly QuestionnaireQuestion[];
  labels: QuestionnaireLabels;
  /** Needed as soon as one question has a `correct` answer. */
  quizLabels?: QuestionnaireQuizLabels;
  /** The answers, controlled. */
  value?: QuestionnaireAnswers;
  defaultValue?: QuestionnaireAnswers;
  onValueChange?: (answers: QuestionnaireAnswers) => void;
  /** The question shown (0-based), controlled. */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Called with all the answers when the reader finishes. */
  onComplete: (answers: QuestionnaireAnswers) => void;
  /** The level of each question's heading, to fit the page's outline. */
  headingLevel?: 2 | 3 | 4;
};

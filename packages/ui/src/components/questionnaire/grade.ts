import type { OptionOutcome, QuestionnaireAnswers, QuestionnaireQuestion } from './types.js';

/**
 * Whether a question has an answer.
 * @param answer - the chosen values
 * @returns true when at least one value is chosen
 */
export function isAnswered(answer: readonly string[] | undefined): boolean {
  return answer !== undefined && answer.length > 0;
}

/**
 * Whether the chosen values are exactly the right ones.
 * @param question - a graded question (with `correct`)
 * @param answer - the chosen values
 * @returns `correct` or `incorrect`; `undefined` for an ungraded question
 */
export function gradeAnswer(
  question: QuestionnaireQuestion,
  answer: readonly string[] | undefined,
): 'correct' | 'incorrect' | undefined {
  if (question.correct === undefined) return undefined;
  const chosen = new Set(answer ?? []);
  const right = new Set(question.correct);
  const exact = chosen.size === right.size && [...right].every((value) => chosen.has(value));
  return exact ? 'correct' : 'incorrect';
}

/**
 * How one option fared: chosen and right, chosen and wrong, right but
 * missed, or neither.
 * @param question - a graded question
 * @param answer - the chosen values
 * @param value - the option's value
 * @returns the option's outcome; `neutral` for an ungraded question
 */
export function optionOutcome(
  question: QuestionnaireQuestion,
  answer: readonly string[] | undefined,
  value: string,
): OptionOutcome {
  if (question.correct === undefined) return 'neutral';
  const chosen = answer?.includes(value) === true;
  const right = question.correct.includes(value);
  if (chosen) return right ? 'correct' : 'incorrect';
  return right ? 'missed' : 'neutral';
}

/**
 * The score over the graded questions, for a results screen.
 * @param questions - all the questions; ungraded ones do not count
 * @param answers - the chosen values per question id
 * @returns how many graded questions were answered right, out of how many
 */
export function scoreAnswers(
  questions: readonly QuestionnaireQuestion[],
  answers: QuestionnaireAnswers,
): { correct: number; total: number } {
  const graded = questions.filter((question) => question.correct !== undefined);
  return {
    correct: graded.filter((question) => gradeAnswer(question, answers[question.id]) === 'correct')
      .length,
    total: graded.length,
  };
}

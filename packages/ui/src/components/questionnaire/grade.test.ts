import { describe, expect, it } from 'vitest';
import { gradeAnswer, isAnswered, optionOutcome, scoreAnswers } from './grade.js';
import type { QuestionnaireQuestion } from './types.js';

const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];
const single: QuestionnaireQuestion = {
  id: 'q1',
  prompt: '?',
  kind: 'single',
  options,
  correct: ['b'],
};
const multiple: QuestionnaireQuestion = {
  id: 'q2',
  prompt: '?',
  kind: 'multiple',
  options,
  correct: ['a', 'c'],
};
const survey: QuestionnaireQuestion = { id: 'q3', prompt: '?', kind: 'single', options };

describe('isAnswered', () => {
  it('needs at least one chosen value', () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered([])).toBe(false);
    expect(isAnswered(['a'])).toBe(true);
  });
});

describe('gradeAnswer', () => {
  it('grades a single choice', () => {
    expect(gradeAnswer(single, ['b'])).toBe('correct');
    expect(gradeAnswer(single, ['a'])).toBe('incorrect');
    expect(gradeAnswer(single, undefined)).toBe('incorrect');
  });

  it('wants exactly the right set for a multiple choice, in any order', () => {
    expect(gradeAnswer(multiple, ['c', 'a'])).toBe('correct');
    expect(gradeAnswer(multiple, ['a'])).toBe('incorrect');
    expect(gradeAnswer(multiple, ['a', 'b', 'c'])).toBe('incorrect');
  });

  it('does not grade a question without a right answer', () => {
    expect(gradeAnswer(survey, ['a'])).toBeUndefined();
  });
});

describe('optionOutcome', () => {
  it('tells chosen-right, chosen-wrong, missed and untouched options apart', () => {
    expect(optionOutcome(multiple, ['a', 'b'], 'a')).toBe('correct');
    expect(optionOutcome(multiple, ['a', 'b'], 'b')).toBe('incorrect');
    expect(optionOutcome(multiple, ['a', 'b'], 'c')).toBe('missed');
    expect(optionOutcome(single, ['b'], 'a')).toBe('neutral');
  });

  it('is neutral for an ungraded question', () => {
    expect(optionOutcome(survey, ['a'], 'a')).toBe('neutral');
  });
});

describe('scoreAnswers', () => {
  it('counts the graded questions only', () => {
    expect(scoreAnswers([single, multiple, survey], { q1: ['b'], q2: ['a'], q3: ['a'] })).toEqual({
      correct: 1,
      total: 2,
    });
  });
});

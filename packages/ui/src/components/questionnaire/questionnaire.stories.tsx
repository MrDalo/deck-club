import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '#components/button';
import {
  Questionnaire,
  scoreAnswers,
  type QuestionnaireAnswers,
  type QuestionnaireQuestion,
} from '.';

const labels = {
  back: 'Back',
  next: 'Next',
  finish: 'Finish',
  progress: (current: number, total: number) => `Question ${current} of ${total}`,
  required: 'Choose an answer to go on.',
};

const quizLabels = {
  check: 'Check',
  correct: 'Correct',
  incorrect: 'Not quite',
  missed: 'The right answer',
};

/** What an AI assistant asks before it writes a deck. */
const briefing: QuestionnaireQuestion[] = [
  {
    id: 'level',
    prompt: 'How well do you know the cell cycle?',
    kind: 'single',
    options: [
      { value: 'new', label: 'It is new to me', description: 'Start from the basics.' },
      { value: 'some', label: 'I know the basics', description: 'Skip the definitions.' },
      { value: 'exam', label: 'Preparing for an exam', description: 'Go deep on the details.' },
    ],
  },
  {
    id: 'focus',
    prompt: 'What should the cards cover?',
    description: 'Pick as many as you like.',
    kind: 'multiple',
    options: [
      { value: 'phases', label: 'The phases, in order' },
      { value: 'terms', label: 'Key terms' },
      { value: 'checkpoints', label: 'Checkpoints and regulation' },
    ],
  },
  {
    id: 'size',
    prompt: 'How many cards?',
    kind: 'single',
    optional: true,
    options: [
      { value: '12', label: '12 cards' },
      { value: '24', label: '24 cards' },
      { value: '48', label: '48 cards' },
    ],
  },
];

/** A quick check on a deck: graded questions. */
const quiz: QuestionnaireQuestion[] = [
  {
    id: 'phase',
    prompt: 'In which phase do the chromosomes line up in the middle of the cell?',
    kind: 'single',
    options: [
      { value: 'prophase', label: 'Prophase' },
      { value: 'metaphase', label: 'Metaphase' },
      { value: 'anaphase', label: 'Anaphase' },
      { value: 'telophase', label: 'Telophase' },
    ],
    correct: ['metaphase'],
    explanation: 'In metaphase the chromosomes line up on the metaphase plate.',
  },
  {
    id: 'organelles',
    prompt: 'Which organelles hold their own DNA?',
    description: 'More than one answer is right.',
    kind: 'multiple',
    options: [
      { value: 'nucleus', label: 'Nucleus' },
      { value: 'ribosome', label: 'Ribosome' },
      { value: 'mitochondrion', label: 'Mitochondrion' },
      { value: 'golgi', label: 'Golgi apparatus' },
    ],
    correct: ['nucleus', 'mitochondrion'],
    explanation: 'Mitochondria keep a small circular genome of their own.',
  },
];

const meta = {
  title: 'Components/Questionnaire',
  component: Questionnaire,
  args: {
    label: 'Before I write your cards',
    questions: briefing,
    labels,
    className: 'w-[28rem] max-w-full',
    onComplete: () => undefined,
  },
} satisfies Meta<typeof Questionnaire>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An AI assistant's questions before writing a deck: one answer, several, then an optional one. */
export const Briefing: Story = {};

export const Quiz: Story = {
  args: { label: 'Quick check: the cell cycle', questions: quiz, quizLabels },
};

/** A graded answer, checked: the wrong choice, the right one and the explanation. */
export const CheckedWrong: Story = {
  args: {
    label: 'Quick check: the cell cycle',
    questions: quiz,
    quizLabels,
    defaultValue: { phase: ['prophase'] },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
  },
};

export const CheckedRight: Story = {
  args: {
    label: 'Quick check: the cell cycle',
    questions: quiz,
    quizLabels,
    defaultStep: 1,
    defaultValue: { organelles: ['nucleus', 'mitochondrion'] },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Check' }));
  },
};

export const MissingAnswer: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
  },
};

export const Czech: Story = {
  args: {
    label: 'Než napíšu tvoje karty',
    labels: {
      back: 'Zpět',
      next: 'Další',
      finish: 'Hotovo',
      progress: (current, total) => `Otázka ${current} z ${total}`,
      required: 'Vyber odpověď, ať můžeš pokračovat.',
    },
    questions: [
      {
        id: 'level',
        prompt: 'Jak dobře znáš buněčný cyklus?',
        kind: 'single',
        options: [
          { value: 'new', label: 'Je to pro mě nové' },
          { value: 'some', label: 'Znám základy' },
        ],
      },
    ],
  },
};

function QuizWithResults(): React.JSX.Element {
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  if (answers === null) {
    return (
      <Questionnaire
        label="Quick check: the cell cycle"
        questions={quiz}
        labels={labels}
        quizLabels={quizLabels}
        onComplete={setAnswers}
        className="w-[28rem] max-w-full"
      />
    );
  }
  const score = scoreAnswers(quiz, answers);
  return (
    <section
      aria-labelledby="quiz-result"
      className="grid w-[28rem] max-w-full gap-4 rounded-card border-2 border-ink bg-card p-6 shadow-sticker"
    >
      <h2 id="quiz-result" className="font-display text-2xl font-semibold">
        {score.correct} of {score.total} right
      </h2>
      <Button variant="secondary" onClick={() => setAnswers(null)} className="justify-self-start">
        Try again
      </Button>
    </section>
  );
}

/** The whole flow: the quiz, then a score built with `scoreAnswers`. */
export const WithResults: Story = { render: () => <QuizWithResults /> };

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Questionnaire, type QuestionnaireQuestion } from '.';

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

const survey: QuestionnaireQuestion[] = [
  {
    id: 'level',
    prompt: 'How well do you know the topic?',
    kind: 'single',
    options: [
      { value: 'new', label: 'It is new to me' },
      { value: 'some', label: 'I know the basics' },
    ],
  },
  {
    id: 'focus',
    prompt: 'What should the cards cover?',
    description: 'Pick any.',
    kind: 'multiple',
    options: [
      { value: 'terms', label: 'Key terms' },
      { value: 'dates', label: 'Dates' },
      { value: 'people', label: 'People' },
    ],
  },
];

const quiz: QuestionnaireQuestion[] = [
  {
    id: 'phase',
    prompt: 'In which phase do chromosomes line up?',
    kind: 'single',
    options: [
      { value: 'prophase', label: 'Prophase' },
      { value: 'metaphase', label: 'Metaphase' },
      { value: 'anaphase', label: 'Anaphase' },
    ],
    correct: ['metaphase'],
    explanation: 'They line up on the metaphase plate.',
  },
  {
    id: 'organelles',
    prompt: 'Which organelles hold DNA?',
    kind: 'multiple',
    options: [
      { value: 'nucleus', label: 'Nucleus' },
      { value: 'ribosome', label: 'Ribosome' },
      { value: 'mitochondrion', label: 'Mitochondrion' },
    ],
    correct: ['nucleus', 'mitochondrion'],
  },
];

describe('Questionnaire', () => {
  it('shows one named question at a time, with where the reader is', () => {
    render(
      <Questionnaire
        label="Before I write your cards"
        questions={survey}
        labels={labels}
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByRole('form', { name: 'Before I write your cards' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'How well do you know the topic?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'How well do you know the topic?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Question 1 of 2' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('asks for an answer before moving on, and names the group invalid', async () => {
    const user = userEvent.setup();
    render(<Questionnaire label="Setup" questions={survey} labels={labels} onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose an answer to go on.');
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Choose an answer to go on.');

    await user.click(screen.getByText('It is new to me'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('walks through the questions, focusing each new heading, and hands over all the answers', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <Questionnaire label="Setup" questions={survey} labels={labels} onComplete={onComplete} />,
    );

    await user.click(screen.getByRole('radio', { name: 'I know the basics' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const heading = screen.getByRole('heading', { name: 'What should the cards cover?' });
    expect(heading).toHaveFocus();
    const group = screen.getByRole('group', { name: 'What should the cards cover?' });
    expect(group).toHaveAccessibleDescription('Pick any.');

    // Clicked out of order, recorded in the order shown.
    await user.click(within(group).getByRole('checkbox', { name: 'People' }));
    await user.click(within(group).getByRole('checkbox', { name: 'Key terms' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(onComplete).toHaveBeenCalledWith({ level: ['some'], focus: ['terms', 'people'] });
  });

  it('goes back with the earlier answer kept', async () => {
    const user = userEvent.setup();
    render(<Questionnaire label="Setup" questions={survey} labels={labels} onComplete={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: 'It is new to me' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('heading', { name: 'How well do you know the topic?' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'It is new to me' })).toBeChecked();
  });

  it('lets an optional question be skipped', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const [first] = survey;
    render(
      <Questionnaire
        label="Setup"
        questions={[{ ...first!, optional: true }]}
        labels={labels}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).toHaveBeenCalledWith({});
  });

  it('grades a checked answer in words and locks it for review', async () => {
    const user = userEvent.setup();
    render(
      <Questionnaire
        label="Quick check"
        questions={quiz}
        labels={labels}
        quizLabels={quizLabels}
        onComplete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an answer to go on.');

    await user.click(screen.getByRole('radio', { name: 'Prophase' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByRole('status')).toHaveTextContent('Not quite');
    expect(screen.getByRole('status')).toHaveTextContent('They line up on the metaphase plate.');
    expect(screen.getByRole('radio', { name: 'Prophase' })).toHaveAccessibleDescription(
      'Not quite',
    );
    expect(screen.getByRole('radio', { name: 'Metaphase' })).toHaveAccessibleDescription(
      'The right answer',
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true');

    // Locked: another choice does not change the answer.
    await user.click(screen.getByText('Anaphase'));
    expect(screen.getByRole('radio', { name: 'Prophase' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('grades a multiple choice on the exact set', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <Questionnaire
        label="Quick check"
        questions={quiz}
        labels={labels}
        quizLabels={quizLabels}
        defaultStep={1}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Nucleus' }));
    await user.click(screen.getByRole('checkbox', { name: 'Mitochondrion' }));
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByRole('status')).toHaveTextContent('Correct');
    expect(screen.getByRole('checkbox', { name: 'Nucleus' })).toHaveAccessibleDescription(
      'Correct',
    );
    expect(screen.getByRole('checkbox', { name: 'Ribosome' })).not.toHaveAccessibleDescription();

    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onComplete).toHaveBeenCalledWith({ organelles: ['nucleus', 'mitochondrion'] });
  });

  it('follows a controlled step', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <Questionnaire
        label="Setup"
        questions={survey}
        labels={labels}
        step={0}
        onStepChange={onStepChange}
        defaultValue={{ level: ['new'] }}
        onComplete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onStepChange).toHaveBeenCalledWith(1);
    expect(
      screen.getByRole('heading', { name: 'How well do you know the topic?' }),
    ).toBeInTheDocument();
  });

  it('refuses graded questions without quiz labels', () => {
    expect(() =>
      render(<Questionnaire label="Quiz" questions={quiz} labels={labels} onComplete={vi.fn()} />),
    ).toThrow('Questionnaire needs quizLabels for questions with a correct answer.');
  });
});

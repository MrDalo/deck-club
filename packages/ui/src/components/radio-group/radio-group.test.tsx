import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioField, RadioGroup, RadioGroupItem } from '.';

function Order({
  onValueChange = vi.fn(),
}: {
  onValueChange?: (value: string) => void;
}): React.JSX.Element {
  return (
    <RadioGroup aria-label="Card order" defaultValue="due" onValueChange={onValueChange}>
      <RadioField value="due" label="Due first" description="Oldest due cards lead." />
      <RadioField value="random" label="Shuffled" />
      <RadioField value="new" label="New first" disabled />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('names each choice by its label and describes it', () => {
    render(<Order />);
    const due = screen.getByRole('radio', { name: 'Due first' });

    expect(due).toBeChecked();
    expect(due).toHaveAccessibleDescription('Oldest due cards lead.');
  });

  it('chooses by click and moves focus with the arrow keys', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Order onValueChange={onValueChange} />);

    await user.click(screen.getByText('Shuffled'));
    expect(screen.getByRole('radio', { name: 'Shuffled' })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('random');

    // A label activates the circle but, like any button, does not focus it.
    // (Radix also checks the radio an arrow lands on; jsdom does not replay
    // that, so the Storybook browser check covers it.)
    screen.getByRole('radio', { name: 'Shuffled' }).focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Due first' })).toHaveFocus();
  });

  it('skips a disabled choice', () => {
    render(<Order />);
    expect(screen.getByRole('radio', { name: 'New first' })).toBeDisabled();
  });

  it('marks the choice with an Ink dot inside an Ink circle', () => {
    render(
      <RadioGroup aria-label="Size">
        <RadioGroupItem value="s" aria-label="Small" />
      </RadioGroup>,
    );
    expect(screen.getByRole('radio')).toHaveClass(
      'border-ink',
      '[&_svg]:fill-ink',
      'data-[state=checked]:bg-lilac',
    );
  });
});

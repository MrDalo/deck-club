import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, CheckboxField } from '.';

describe('Checkbox', () => {
  it('toggles by click and by Space', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Shuffle" onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Shuffle' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
  });

  it('shows its state with an Ink outline, not the pastel alone', () => {
    render(<Checkbox aria-label="Shuffle" defaultChecked />);
    expect(screen.getByRole('checkbox')).toHaveClass(
      'border-2',
      'border-ink',
      'data-[state=checked]:bg-lilac',
      'data-[state=checked]:text-ink',
    );
  });

  it('reports mixed for indeterminate and draws a dash', () => {
    render(<Checkbox aria-label="All cards" checked="indeterminate" />);
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox).toHaveClass('data-[state=indeterminate]:[&_svg]:hidden');
  });

  it('marks an invalid box in Danger', () => {
    render(<Checkbox aria-label="Terms" aria-invalid />);
    expect(screen.getByRole('checkbox')).toHaveClass('aria-invalid:border-danger');
  });
});

describe('CheckboxField', () => {
  it('names the box by its label and describes it', async () => {
    const user = userEvent.setup();
    render(<CheckboxField label="Daily reminder" description="An email at 8:00." />);
    const checkbox = screen.getByRole('checkbox', { name: 'Daily reminder' });

    expect(checkbox).toHaveAccessibleDescription('An email at 8:00.');
    await user.click(screen.getByText('Daily reminder'));
    expect(checkbox).toBeChecked();
  });

  it('keeps a given id', () => {
    render(<CheckboxField id="shuffle" label="Shuffle" />);
    expect(screen.getByRole('checkbox', { name: 'Shuffle' })).toHaveAttribute('id', 'shuffle');
  });

  it('dims the whole field when disabled', () => {
    const { container } = render(<CheckboxField label="Shuffle" disabled />);
    expect(container.firstChild).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});

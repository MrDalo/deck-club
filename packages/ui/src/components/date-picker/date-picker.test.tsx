import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sk } from 'react-day-picker/locale';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker, DateRangePicker } from '.';

const NOVEMBER = new Date(2026, 10, 1);

describe('DatePicker', () => {
  it('shows the placeholder until a date is picked', () => {
    render(<DatePicker placeholder="Pick a date" />);
    expect(screen.getByRole('button', { name: 'Pick a date' })).toHaveAttribute(
      'data-empty',
      'true',
    );
  });

  it('picks a date, writes it out and closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        placeholder="Pick a date"
        locale={sk}
        calendar={{ defaultMonth: NOVEMBER }}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pick a date' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /18\. novembra 2026/ }));

    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 10, 18));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '18. novembra 2026' })).toBeInTheDocument();
  });

  it('announces the label and the chosen date together', () => {
    render(
      <>
        <span id="exam-label">Exam date</span>
        <DatePicker
          placeholder="Pick a date"
          aria-labelledby="exam-label"
          defaultValue={new Date(2026, 10, 18)}
          locale={sk}
        />
      </>,
    );
    expect(screen.getByRole('button', { name: 'Exam date 18. novembra 2026' })).toBeInTheDocument();
  });

  it('follows a controlled value', () => {
    const { rerender } = render(<DatePicker placeholder="Pick a date" value={null} />);
    expect(screen.getByRole('button', { name: 'Pick a date' })).toBeInTheDocument();

    rerender(
      <DatePicker
        placeholder="Pick a date"
        value={new Date(2026, 0, 2)}
        formatOptions={{ dateStyle: 'short' }}
        locale={sk}
      />,
    );
    expect(screen.getByRole('button', { name: '2. 1. 2026' })).toBeInTheDocument();
  });

  it('looks like a field and marks an invalid one in Danger', () => {
    render(<DatePicker placeholder="Pick a date" aria-invalid />);
    expect(screen.getByRole('button')).toHaveClass('border-ink/80', 'aria-invalid:border-danger');
  });

  it('stays shut when disabled', async () => {
    const user = userEvent.setup();
    render(<DatePicker placeholder="Pick a date" disabled />);

    await user.click(screen.getByRole('button'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('DateRangePicker', () => {
  it('picks a start and an end, then closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        placeholder="Pick dates"
        calendar={{ defaultMonth: NOVEMBER }}
        numberOfMonths={1}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pick dates' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /November 16, 2026/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /November 20, 2026/ }));

    expect(onValueChange).toHaveBeenLastCalledWith({
      from: new Date(2026, 10, 16),
      to: new Date(2026, 10, 20),
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

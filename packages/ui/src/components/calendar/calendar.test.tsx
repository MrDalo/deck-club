import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sk } from 'react-day-picker/locale';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from '.';

const NOVEMBER = new Date(2026, 10, 1);

describe('Calendar', () => {
  it('selects a day and marks it with the Ink outline', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Calendar mode="single" defaultMonth={NOVEMBER} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /November 18, 2026/ }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0]?.[0]).toEqual(new Date(2026, 10, 18));
  });

  it('draws a selected day Lilac inside an Ink outline', () => {
    render(<Calendar mode="single" defaultMonth={NOVEMBER} selected={new Date(2026, 10, 18)} />);
    const day = screen.getByRole('button', { name: /November 18, 2026/ });

    expect(day).toHaveAttribute('data-selected-single', 'true');
    expect(day).toHaveClass(
      'data-[selected-single=true]:bg-lilac',
      'data-[selected-single=true]:border-ink',
    );
  });

  it('names English days with the visible number, for speech input', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={NOVEMBER}
        selected={new Date(2026, 10, 1)}
        today={new Date(2026, 10, 2)}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Sunday, November 1, 2026, selected' }),
    ).toHaveTextContent(/^1$/);
    expect(
      screen.getByRole('button', { name: 'Today, Monday, November 2, 2026' }),
    ).toBeInTheDocument();
  });

  it('keeps a locale’s own translated day names', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={NOVEMBER}
        selected={new Date(2026, 10, 18)}
        locale={sk}
      />,
    );
    expect(screen.getByRole('button', { name: /18\. novembra 2026, vybraté/ })).toBeInTheDocument();
  });

  it('moves between months with its navigation buttons', async () => {
    const user = userEvent.setup();
    render(<Calendar mode="single" defaultMonth={NOVEMBER} />);

    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByRole('grid', { name: /December 2026/ })).toBeInTheDocument();
  });

  it('speaks Slovak with a Slovak locale, weeks starting on Monday', () => {
    const { container, rerender } = render(
      <Calendar mode="single" defaultMonth={NOVEMBER} locale={sk} />,
    );
    const firstWeekday = (): string | null | undefined =>
      container.querySelector('.rdp-weekday')?.textContent;

    expect(screen.getByRole('grid')).toHaveAccessibleName(/november 2026/i);
    expect(firstWeekday()).toMatch(/^po/i);

    rerender(<Calendar mode="single" defaultMonth={NOVEMBER} />);
    expect(firstWeekday()).toMatch(/^su/i);
  });

  it('sits on a sticker card unless unframed', () => {
    const { container, rerender } = render(<Calendar mode="single" defaultMonth={NOVEMBER} />);
    expect(container.querySelector('[data-slot="calendar"]')).toHaveClass('border-ink');

    rerender(<Calendar mode="single" defaultMonth={NOVEMBER} framed={false} />);
    expect(container.querySelector('[data-slot="calendar"]')).not.toHaveClass('border-ink');
  });
});

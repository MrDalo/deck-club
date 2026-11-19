import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, REGEXP_ONLY_DIGITS } from '.';

function Code({
  onComplete = vi.fn(),
}: {
  onComplete?: (code: string) => void;
}): React.JSX.Element {
  return (
    <InputOTP
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      aria-label="Sign-in code"
      onComplete={onComplete}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

describe('InputOTP', () => {
  it('is one named input that autofills one-time codes', () => {
    render(<Code />);
    const input = screen.getByRole('textbox', { name: 'Sign-in code' });

    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('maxlength', '6');
  });

  it('spreads typed digits over the boxes and reports the full code', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const { container } = render(<Code onComplete={onComplete} />);

    await user.click(screen.getByRole('textbox'));
    await user.keyboard('482915');

    const boxes = container.querySelectorAll('[data-slot="input-otp-slot"]');
    expect(Array.from(boxes, (box) => box.textContent).join('')).toBe('482915');
    expect(onComplete).toHaveBeenCalledWith('482915');
  });

  it('refuses letters when digits only', async () => {
    const user = userEvent.setup();
    render(<Code />);

    await user.click(screen.getByRole('textbox'));
    await user.keyboard('4a8');
    expect(screen.getByRole('textbox')).toHaveValue('48');
  });

  it('draws boxes in Ink with the Focus outline on the active one', () => {
    const { container } = render(<Code />);
    expect(container.querySelector('[data-slot="input-otp-slot"]')).toHaveClass(
      'border-ink',
      'font-display',
      'data-[active=true]:outline-focus',
    );
  });
});

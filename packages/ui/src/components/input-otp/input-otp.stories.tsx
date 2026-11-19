import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
  type InputOTPProps,
} from '.';

/** input-otp takes either `children` or a `render` function; stories always pass children. */
type StoryArgs = Omit<InputOTPProps, 'children' | 'render'>;

const meta = {
  title: 'Components/Input OTP',
  args: { maxLength: 6, 'aria-label': 'Sign-in code', pattern: REGEXP_ONLY_DIGITS },
  argTypes: { disabled: { control: 'boolean' } },
  render: (args) => (
    <InputOTP {...args}>
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
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<StoryArgs>;

export const SixDigits: Story = {};
export const Filled: Story = { args: { defaultValue: '482915' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: '4829' } };

export const FourDigits: Story = {
  args: { maxLength: 4 },
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup>
        {[0, 1, 2, 3].map((index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const Invalid: Story = {
  args: { defaultValue: '482915' },
  render: (args) => (
    <div className="grid gap-2">
      <InputOTP {...args} aria-describedby="code-error">
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} aria-invalid />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p id="code-error" className="text-sm font-semibold text-danger">
        That code has expired. Ask for a new one.
      </p>
    </div>
  ),
};

export const Controlled: Story = {
  render: (args) => {
    const [code, setCode] = useState('');
    return (
      <div className="grid gap-3">
        <InputOTP {...args} value={code} onChange={setCode}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-sm text-ink-soft">Typed: {code === '' ? 'nothing yet' : code}</p>
      </div>
    );
  },
};

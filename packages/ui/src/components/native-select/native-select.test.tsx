import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '.';

function Language(props: { onChange?: () => void; disabled?: boolean }): React.JSX.Element {
  return (
    <NativeSelect aria-label="Deck language" defaultValue="en" {...props}>
      <NativeSelectOptGroup label="Most used">
        <NativeSelectOption value="en">English</NativeSelectOption>
        <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOption value="cs">Čeština</NativeSelectOption>
    </NativeSelect>
  );
}

describe('NativeSelect', () => {
  it('is the browser’s own select and chooses an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Language onChange={onChange} />);
    const select = screen.getByRole('combobox', { name: 'Deck language' });

    expect(select.tagName).toBe('SELECT');
    await user.selectOptions(select, 'Slovenčina');
    expect(select).toHaveValue('sk');
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('groups options', () => {
    render(<Language />);
    expect(screen.getByRole('group', { name: 'Most used' })).toBeInTheDocument();
  });

  it('is a full-width brand field with a decorative Ink chevron', () => {
    const { container } = render(<Language />);
    const wrapper = screen.getByRole('combobox').parentElement;

    expect(wrapper).toHaveClass(
      'w-full',
      '[&>select]:h-11',
      '[&>select]:border-ink/80',
      '[&>select]:focus-visible:outline-focus',
    );
    expect(container.querySelector('[data-slot="native-select-icon"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('dims once when disabled, on the wrapper, not twice', () => {
    render(<Language disabled />);
    const select = screen.getByRole('combobox');

    expect(select).toBeDisabled();
    expect(select.parentElement).toHaveClass('has-[select:disabled]:opacity-50');
    expect(select.className).not.toContain('opacity');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption, type ComboboxProps } from '.';

const LANGUAGES: ComboboxOption[] = [
  { value: 'en', label: 'English' },
  { value: 'sk', label: 'Slovenčina', keywords: ['Slovak'] },
  { value: 'cs', label: 'Čeština', keywords: ['Czech'] },
  { value: 'la', label: 'Latin', disabled: true },
];

function Language(props: Partial<ComboboxProps>): React.JSX.Element {
  return (
    <Combobox
      aria-label="Deck language"
      options={LANGUAGES}
      placeholder="Choose a language"
      searchPlaceholder="Search languages"
      emptyMessage="No language matches."
      {...props}
    />
  );
}

describe('Combobox', () => {
  it('is a collapsed combobox showing the placeholder', () => {
    render(<Language />);
    const box = screen.getByRole('combobox', { name: 'Deck language' });

    expect(box).toHaveAttribute('aria-expanded', 'false');
    expect(box).toHaveTextContent('Choose a language');
  });

  it('finds an option by a keyword and chooses it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Language onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Deck language' }));
    await user.keyboard('slovak');
    await user.click(screen.getByRole('option', { name: 'Slovenčina' }));

    expect(onValueChange).toHaveBeenCalledWith('sk');
    expect(screen.getByRole('combobox', { name: 'Deck language' })).toHaveTextContent('Slovenčina');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('chooses with arrows and Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Language onValueChange={onValueChange} />);

    const box = screen.getByRole('combobox', { name: 'Deck language' });
    await user.click(box);
    const popup = document.getElementById(box.getAttribute('aria-controls') ?? '');
    expect(box).toHaveAttribute('aria-haspopup', 'dialog');
    expect(popup).toHaveAttribute('role', 'dialog');
    expect(popup).toContainElement(screen.getByRole('listbox', { name: 'Choose a language' }));
    expect(screen.getByRole('combobox', { name: 'Search languages' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('cs');
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Language />);

    await user.click(screen.getByRole('combobox', { name: 'Deck language' }));
    await user.keyboard('klingon');

    expect(screen.getByText('No language matches.')).toBeInTheDocument();
  });

  it('never chooses a disabled option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Language onValueChange={onValueChange} />);

    await user.click(screen.getByRole('combobox', { name: 'Deck language' }));
    await user.click(screen.getByRole('option', { name: 'Latin' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks the chosen option and follows a controlled value', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Language value="en" />);
    expect(screen.getByRole('combobox', { name: 'Deck language' })).toHaveTextContent('English');

    rerender(<Language value="cs" />);
    await user.click(screen.getByRole('combobox', { name: 'Deck language' }));
    expect(screen.getByRole('option', { name: 'Čeština' })).toHaveAttribute('aria-selected');
  });

  it('lists groups under their headings', async () => {
    const user = userEvent.setup();
    render(
      <Language
        options={[
          { value: 'sk', label: 'Slovenčina', group: 'Slavic' },
          { value: 'en', label: 'English', group: 'Germanic' },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox', { name: 'Deck language' }));
    expect(screen.getByRole('group', { name: 'Slavic' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Germanic' })).toBeInTheDocument();
  });

  it('looks like a field and marks an invalid one in Danger', () => {
    render(<Language aria-invalid />);
    expect(screen.getByRole('combobox', { name: 'Deck language' })).toHaveClass(
      'border-ink/80',
      'aria-invalid:border-danger',
    );
  });
});

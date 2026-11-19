import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Combobox, type ComboboxOption } from '.';

const LANGUAGES: ComboboxOption[] = [
  { value: 'en', label: 'English', group: 'Most used' },
  { value: 'sk', label: 'Slovenčina', group: 'Most used', keywords: ['Slovak'] },
  { value: 'cs', label: 'Čeština', group: 'Most used', keywords: ['Czech'] },
  { value: 'de', label: 'Deutsch', group: 'More languages', keywords: ['German'] },
  { value: 'es', label: 'Español', group: 'More languages', keywords: ['Spanish'] },
  { value: 'fr', label: 'Français', group: 'More languages', keywords: ['French'] },
  { value: 'it', label: 'Italiano', group: 'More languages', keywords: ['Italian'] },
  { value: 'pl', label: 'Polski', group: 'More languages', keywords: ['Polish'] },
  { value: 'la', label: 'Latina (coming soon)', group: 'More languages', disabled: true },
];

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  args: {
    options: LANGUAGES,
    placeholder: 'Choose a language',
    searchPlaceholder: 'Search languages',
    emptyMessage: 'No language matches. Try its English name.',
    'aria-labelledby': 'language-label',
  },
  argTypes: { disabled: { control: 'boolean' }, 'aria-invalid': { control: 'boolean' } },
  decorators: [
    (Story) => (
      <div className="grid max-w-xs gap-1.5">
        <span id="language-label" className="text-sm font-semibold">
          Deck language
        </span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {};
export const Preselected: Story = { args: { defaultValue: 'sk' } };
export const Flat: Story = {
  args: {
    options: LANGUAGES.map(({ group: _group, ...option }) => option),
    placeholder: 'Choose a language',
  },
};
export const Controlled: Story = {
  render: (args) => {
    const [language, setLanguage] = useState<string | null>('cs');
    return (
      <div className="grid gap-2">
        <Combobox {...args} value={language} onValueChange={setLanguage} />
        <p className="text-sm text-ink-soft">Chosen: {language ?? 'nothing'}</p>
      </div>
    );
  },
};
export const Invalid: Story = { args: { 'aria-invalid': true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'en' } };

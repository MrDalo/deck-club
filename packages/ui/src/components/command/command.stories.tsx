import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpenIcon, LayersIcon, PlusIcon, SettingsIcon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '#components/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '.';

function Items(): React.JSX.Element {
  return (
    <>
      <CommandEmpty>No decks or actions match. Try another word.</CommandEmpty>
      <CommandGroup heading="Decks">
        <CommandItem>
          <LayersIcon aria-hidden />
          Biology exam
        </CommandItem>
        <CommandItem>
          <LayersIcon aria-hidden />
          Spanish verbs
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Actions">
        <CommandItem>
          <PlusIcon aria-hidden />
          New deck
          <CommandShortcut>⌘N</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <BookOpenIcon aria-hidden />
          Study due cards
          <CommandShortcut>⌘S</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <SparklesIcon aria-hidden />
          Connect your AI
        </CommandItem>
        <CommandItem disabled>
          <SettingsIcon aria-hidden />
          Battles (coming soon)
        </CommandItem>
      </CommandGroup>
    </>
  );
}

const meta = {
  title: 'Components/Command',
  component: Command,
  argTypes: { variant: { control: 'inline-radio', options: ['sticker', 'bare'] } },
  args: { label: 'Search Deck Club', className: 'max-w-md' },
  render: (args) => (
    <Command {...args}>
      <CommandInput placeholder="Search decks and actions" />
      <CommandList label="Decks and actions">
        <Items />
      </CommandList>
    </Command>
  ),
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sticker: Story = {};
export const Bare: Story = { args: { variant: 'bare' } };

export const Palette: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Search <CommandShortcut>⌘K</CommandShortcut>
        </Button>
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Search Deck Club"
          description="Find a deck or run an action."
        >
          <CommandInput placeholder="Search decks and actions" />
          <CommandList label="Decks and actions">
            <Items />
          </CommandList>
        </CommandDialog>
      </>
    );
  },
};

export const PaletteOpen: Story = {
  render: () => (
    <CommandDialog open title="Search Deck Club" description="Find a deck or run an action.">
      <CommandInput placeholder="Search decks and actions" />
      <CommandList label="Decks and actions">
        <Items />
      </CommandList>
    </CommandDialog>
  ),
};

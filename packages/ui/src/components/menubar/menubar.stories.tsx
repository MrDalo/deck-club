import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '.';

const meta = {
  title: 'Components/Menubar',
  component: Menubar,
  args: { 'aria-label': 'Card editor' },
  render: (args) => {
    const [answers, setAnswers] = useState(true);
    const [size, setSize] = useState('medium');
    return (
      <Menubar {...args}>
        <MenubarMenu>
          <MenubarTrigger>Deck</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New card <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              Import cards… <MenubarShortcut>⌘I</MenubarShortcut>
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>CSV</MenubarItem>
                <MenubarItem>Anki deck</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Delete deck</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Card</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Edit <MenubarShortcut>E</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>Suspend</MenubarItem>
            <MenubarItem disabled>Move to club (coming soon)</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={answers} onCheckedChange={setAnswers}>
              Show answers
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarLabel>Card size</MenubarLabel>
            <MenubarRadioGroup value={size} onValueChange={setSize}>
              <MenubarRadioItem value="small">Small</MenubarRadioItem>
              <MenubarRadioItem value="medium">Medium</MenubarRadioItem>
              <MenubarRadioItem value="large">Large</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    );
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editor: Story = {};

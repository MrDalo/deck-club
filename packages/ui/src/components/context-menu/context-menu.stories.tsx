import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '.';

const CARD_CLASSES =
  'ruled flex h-40 w-72 items-end rounded-card border-2 border-ink p-4 font-display text-lg font-bold shadow-sticker-sm';

const meta = {
  title: 'Components/Context Menu',
  component: ContextMenu,
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className={CARD_CLASSES}>Right-click this card</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <PencilIcon aria-hidden />
          Edit card
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <CopyIcon aria-hidden />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>Share (coming soon)</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2Icon aria-hidden />
          Delete card
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithSubmenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className={CARD_CLASSES}>Right-click this card</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit card</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to deck</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Biology exam</ContextMenuItem>
            <ContextMenuItem>Spanish verbs</ContextMenuItem>
            <ContextMenuItem>Chemistry</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const CheckboxesAndRadios: Story = {
  render: () => {
    const [suspended, setSuspended] = useState(false);
    const [flag, setFlag] = useState('none');
    return (
      <ContextMenu>
        <ContextMenuTrigger className={CARD_CLASSES}>Right-click this card</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked={suspended} onCheckedChange={setSuspended}>
            Suspended
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel>Flag</ContextMenuLabel>
          <ContextMenuRadioGroup value={flag} onValueChange={setFlag}>
            <ContextMenuRadioItem value="none">No flag</ContextMenuRadioItem>
            <ContextMenuRadioItem value="review">Review later</ContextMenuRadioItem>
            <ContextMenuRadioItem value="hard">Hard one</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};

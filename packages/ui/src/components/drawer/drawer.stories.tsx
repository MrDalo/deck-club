import type { Meta, StoryObj } from '@storybook/react-vite';
import { PauseIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { Button } from '#components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '.';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  argTypes: { direction: { control: 'inline-radio', options: ['bottom', 'top', 'left', 'right'] } },
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button variant="secondary">Card actions</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Mitosis</DrawerTitle>
            <DrawerDescription>What would you like to do with this card?</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button>
              <PencilIcon aria-hidden />
              Edit card
            </Button>
            <Button variant="secondary">
              <PauseIcon aria-hidden />
              Suspend card
            </Button>
            <Button variant="danger">
              <Trash2Icon aria-hidden />
              Delete card
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bottom: Story = {};
export const Right: Story = { args: { direction: 'right' } };
export const Left: Story = { args: { direction: 'left' } };
export const Top: Story = { args: { direction: 'top' } };
export const Open: Story = { args: { defaultOpen: true } };

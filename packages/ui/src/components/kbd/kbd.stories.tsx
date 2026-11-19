import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Kbd, KbdGroup } from '.';

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  args: { children: 'Space' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Key: Story = {};

export const Shortcut: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const InText: Story = {
  render: () => (
    <p className="text-base">
      Press <Kbd>Space</Kbd> to flip the card, then <Kbd>1</Kbd>–<Kbd>4</Kbd> to rate it.
    </p>
  ),
};

export const Arrows: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>
        <ArrowLeftIcon aria-hidden />
        <span className="sr-only">Left arrow</span>
      </Kbd>
      <Kbd>
        <ArrowRightIcon aria-hidden />
        <span className="sr-only">Right arrow</span>
      </Kbd>
      <span>previous and next card</span>
    </KbdGroup>
  ),
};

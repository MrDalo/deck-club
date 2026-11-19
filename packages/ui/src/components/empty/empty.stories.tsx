import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayersIcon, SearchXIcon, SparklesIcon } from 'lucide-react';
import { Button } from '#components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '.';

const meta = {
  title: 'Components/Empty',
  component: Empty,
  argTypes: { variant: { control: 'inline-radio', options: ['dashed', 'ruled', 'plain'] } },
  args: { className: 'max-w-lg' },
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia>
          <LayersIcon />
        </EmptyMedia>
        <EmptyTitle>No decks yet</EmptyTitle>
        <EmptyDescription>
          Make your first deck, or ask your AI assistant to make one for you.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>New deck</Button>
        <Button variant="secondary">Connect your AI</Button>
      </EmptyContent>
    </Empty>
  ),
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dashed: Story = {};
export const Ruled: Story = { args: { variant: 'ruled' } };
export const Plain: Story = { args: { variant: 'plain' } };

export const NoResults: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia tone="sky">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>No cards match “meiosis”</EmptyTitle>
        <EmptyDescription>
          Try another word, or <a href="#new-card">add a card about it</a>.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const AllCaughtUp: Story = {
  render: (args) => (
    <Empty {...args} variant="plain">
      <EmptyHeader>
        <EmptyMedia tone="mint">
          <SparklesIcon />
        </EmptyMedia>
        <EmptyTitle>All caught up</EmptyTitle>
        <EmptyDescription>No cards are due. Come back tomorrow.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

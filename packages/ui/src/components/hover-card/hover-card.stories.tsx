import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparklesIcon } from 'lucide-react';
import { Avatar } from '#components/avatar';
import { Badge } from '#components/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.';

const LINK =
  'rounded-sm font-semibold text-ink underline decoration-2 underline-offset-4 hover:decoration-focus';

const meta = {
  title: 'Components/Hover Card',
  component: HoverCard,
  args: { openDelay: 200 },
  argTypes: { defaultOpen: { control: 'boolean' } },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Deck: Story = {
  render: (args) => (
    <p className="text-base">
      Studying{' '}
      <HoverCard {...args}>
        <HoverCardTrigger href="#biology" className={LINK}>
          Biology exam
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="grid gap-2">
            <p className="font-display text-lg font-bold">Biology exam</p>
            <p className="text-sm text-ink-soft">Cells, genetics and evolution.</p>
            <div className="flex gap-2">
              <Badge tone="butter">12 due</Badge>
              <Badge tone="paper">42 cards</Badge>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{' '}
      this week.
    </p>
  ),
};

export const Person: Story = {
  render: (args) => (
    <HoverCard {...args}>
      <HoverCardTrigger href="#jana" className={LINK}>
        Jana Nováková
      </HoverCardTrigger>
      <HoverCardContent className="flex gap-3">
        <Avatar name="Jana Nováková" size="lg" />
        <div className="grid gap-1">
          <p className="font-bold">Jana Nováková</p>
          <p className="text-sm text-ink-soft">Biology club · 14-day streak</p>
          <Badge tone="mint">
            <SparklesIcon aria-hidden />
            Uses Claude
          </Badge>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Open: Story = { ...Deck, args: { defaultOpen: true } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from 'react';
import { ChevronRightIcon, FileSpreadsheetIcon, LayersIcon, SparklesIcon } from 'lucide-react';
import { Avatar } from '#components/avatar';
import { Badge } from '#components/badge';
import { Button } from '#components/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '.';

const meta = {
  title: 'Components/Item',
  component: Item,
  argTypes: {
    variant: { control: 'inline-radio', options: ['plain', 'outline', 'sticker', 'muted'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
  args: { variant: 'outline' },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon" tone="mint">
        <LayersIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Biology exam</ItemTitle>
        <ItemDescription>42 cards · 12 due today</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm">Study</Button>
      </ItemActions>
    </Item>
  ),
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Sticker: Story = { args: { variant: 'sticker' } };
export const Plain: Story = { args: { variant: 'plain' } };
export const Muted: Story = { args: { variant: 'muted' } };
export const Small: Story = { args: { size: 'sm' } };

export const AsLink: Story = {
  render: (args) => (
    <Item {...args} asChild>
      <a href="#connect">
        <ItemMedia variant="icon" tone="lilac">
          <SparklesIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Connect your AI</ItemTitle>
          <ItemDescription>Let Claude or ChatGPT make cards for you.</ItemDescription>
        </ItemContent>
        <ChevronRightIcon aria-hidden className="size-5" />
      </a>
    </Item>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: (args) => (
    <Item {...args} variant="sticker">
      <ItemHeader>
        <Badge tone="mint">
          <SparklesIcon aria-hidden />
          Added by Claude
        </Badge>
        <span className="text-sm text-ink-soft">2 min ago</span>
      </ItemHeader>
      <ItemMedia variant="icon" tone="sky">
        <FileSpreadsheetIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>10 cards about cell division</ItemTitle>
        <ItemDescription>Added to Biology exam.</ItemDescription>
      </ItemContent>
      <ItemFooter>
        <Button size="sm" variant="secondary">
          Review them
        </Button>
      </ItemFooter>
    </Item>
  ),
};

export const MemberList: Story = {
  render: () => (
    <ItemGroup aria-label="Biology club members" className="gap-0">
      {[
        { name: 'Jana Nováková', text: '14-day streak', role: 'Owner' },
        { name: 'Peter Horváth', text: '3-day streak', role: 'Member' },
        { name: 'Eva Svobodová', text: 'Joined today', role: 'Member' },
      ].map((member, index) => (
        <Fragment key={member.name}>
          {index > 0 && <ItemSeparator />}
          <Item size="sm">
            <ItemMedia>
              <Avatar name={member.name} size="sm" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{member.name}</ItemTitle>
              <ItemDescription>{member.text}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge tone={member.role === 'Owner' ? 'butter' : 'paper'}>{member.role}</Badge>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  ),
};

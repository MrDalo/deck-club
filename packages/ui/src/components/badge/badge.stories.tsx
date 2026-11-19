import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparklesIcon } from 'lucide-react';
import { Badge } from '.';

const TONES = ['lilac', 'mint', 'peach', 'rose', 'sky', 'butter', 'paper'] as const;

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: '12 due' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'inline-radio', options: ['soft', 'sticker'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => (
        <Badge key={tone} {...args} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const Sticker: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => (
        <Badge key={tone} {...args} tone={tone} variant="sticker">
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  args: { tone: 'mint' },
  render: (args) => (
    <Badge {...args}>
      <SparklesIcon aria-hidden />
      Added by Claude
    </Badge>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Badge asChild tone="sky" variant="sticker">
      <a href="#spanish">Spanish</a>
    </Badge>
  ),
};

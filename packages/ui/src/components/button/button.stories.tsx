import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRightIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '.';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Add card' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'danger', 'ghost', 'link'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'icon', 'icon-sm'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Delete deck' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Skip' } };
export const Link: Story = { args: { variant: 'link', children: 'See all decks' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-4">
      <Button {...args}>
        <PlusIcon aria-hidden />
        Add card
      </Button>
      <Button {...args} variant="secondary">
        Study now
        <ArrowRightIcon aria-hidden />
      </Button>
      <Button {...args} variant="danger">
        <Trash2Icon aria-hidden />
        Delete
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="icon" aria-label="Add card">
        <PlusIcon aria-hidden />
      </Button>
      <Button size="icon-sm" variant="secondary" aria-label="Delete card">
        <Trash2Icon aria-hidden />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {(['primary', 'secondary', 'danger', 'ghost', 'link'] as const).map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Button asChild variant="secondary">
      <a href="#decks">Your decks</a>
    </Button>
  ),
};

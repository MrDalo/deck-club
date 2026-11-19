import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '.';

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card'] } },
  args: { className: 'max-w-md' },
  render: (args) => (
    <Collapsible {...args}>
      <p className="font-display text-lg font-bold">What is the powerhouse of the cell?</p>
      <CollapsibleTrigger className="mt-2">Show the answer</CollapsibleTrigger>
      <CollapsibleContent>
        <p className="ruled mt-3 rounded-xl border-2 border-ink px-4 pt-12 pb-4">
          The mitochondria: it makes the cell’s energy.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};
export const Card: Story = { args: { variant: 'card' } };
export const Open: Story = { args: { variant: 'card', defaultOpen: true } };

export const WithButtonTrigger: Story = {
  render: (args) => (
    <Collapsible {...args}>
      <CollapsibleTrigger asChild>
        <Button variant="secondary" size="sm">
          Advanced settings
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        New cards per day, maximum reviews, learning steps.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Disabled: Story = { args: { disabled: true } };

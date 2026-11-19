import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparklesIcon } from 'lucide-react';
import { Button } from '#components/button';
import { Alert, AlertDescription, AlertTitle } from '.';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  argTypes: {
    tone: { control: 'inline-radio', options: ['info', 'success', 'warning', 'danger', 'note'] },
  },
  args: { className: 'max-w-md' },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Cards added</AlertTitle>
      <AlertDescription>
        Claude added 10 cards about cell division to Biology exam.
      </AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = { args: { tone: 'success' } };
export const Warning: Story = {
  args: { tone: 'warning' },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Almost at the daily limit</AlertTitle>
      <AlertDescription>You have 3 new cards left for today.</AlertDescription>
    </Alert>
  ),
};
export const Danger: Story = {
  args: { tone: 'danger' },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Could not save the card</AlertTitle>
      <AlertDescription>
        <p>Check your connection and try again.</p>
        <Button size="sm" variant="secondary">
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  ),
};
export const Note: Story = { args: { tone: 'note' } };
export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args} tone="success">
      <AlertTitle>Deck created.</AlertTitle>
    </Alert>
  ),
};
export const CustomIcon: Story = { args: { tone: 'success', icon: <SparklesIcon aria-hidden /> } };
export const WithoutIcon: Story = { args: { icon: false } };

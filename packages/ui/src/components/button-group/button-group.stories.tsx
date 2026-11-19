import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { Button } from '#components/button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '.';

const meta = {
  title: 'Components/Button Group',
  component: ButtonGroup,
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  args: { 'aria-label': 'Rate this card' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button className="bg-rose">Again</Button>
      <Button className="bg-peach">Hard</Button>
      <Button className="bg-mint">Good</Button>
      <Button className="bg-sky">Easy</Button>
    </ButtonGroup>
  ),
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The four review ratings in their brand colours (brand/README.md). */
export const Ratings: Story = {};
export const Vertical: Story = { args: { orientation: 'vertical' } };

export const Secondary: Story = {
  args: { 'aria-label': 'View' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary">Cards</Button>
      <Button variant="secondary">Stats</Button>
      <Button variant="secondary">Settings</Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  args: { 'aria-label': 'New cards per day' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary" size="icon" aria-label="Fewer">
        <MinusIcon aria-hidden />
      </Button>
      <ButtonGroupText>20 a day</ButtonGroupText>
      <Button variant="secondary" size="icon" aria-label="More">
        <PlusIcon aria-hidden />
      </Button>
    </ButtonGroup>
  ),
};

export const WithSeparator: Story = {
  args: { 'aria-label': 'Card' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary" size="icon" aria-label="Previous card">
        <ChevronLeftIcon aria-hidden />
      </Button>
      <ButtonGroupSeparator />
      <Button variant="secondary" size="icon" aria-label="Next card">
        <ChevronRightIcon aria-hidden />
      </Button>
    </ButtonGroup>
  ),
};

export const Nested: Story = {
  args: { 'aria-label': 'Editor' },
  render: (args) => (
    <ButtonGroup {...args}>
      <ButtonGroup aria-label="History">
        <Button variant="secondary" size="sm">
          Undo
        </Button>
        <Button variant="secondary" size="sm">
          Redo
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Save">
        <Button size="sm">Save card</Button>
      </ButtonGroup>
    </ButtonGroup>
  ),
};

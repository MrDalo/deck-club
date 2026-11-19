import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioField, RadioGroup, RadioGroupItem } from '.';

const meta = {
  title: 'Components/Radio Group',
  component: RadioGroup,
  args: { defaultValue: 'due', 'aria-label': 'Card order' },
  argTypes: {
    disabled: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioField
        value="due"
        label="Due first"
        description="The cards you are about to forget lead."
      />
      <RadioField value="random" label="Shuffled" description="Every session in a new order." />
      <RadioField value="new" label="New first" description="Learn new cards before reviewing." />
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDescriptions: Story = {};
export const Disabled: Story = { args: { disabled: true } };

export const Compact: Story = {
  args: { defaultValue: 'good', 'aria-label': 'How well did you know it?' },
  render: (args) => (
    <RadioGroup {...args} className="flex gap-5">
      {['Again', 'Hard', 'Good', 'Easy'].map((rating) => (
        <RadioField key={rating} value={rating.toLowerCase()} label={rating} />
      ))}
    </RadioGroup>
  ),
};

export const Invalid: Story = {
  args: { defaultValue: undefined, 'aria-label': 'Deck visibility' },
  render: (args) => (
    <div className="grid gap-2">
      <RadioGroup {...args} aria-describedby="visibility-error" aria-invalid>
        <RadioField value="private" label="Only me" aria-invalid />
        <RadioField value="club" label="My club" aria-invalid />
      </RadioGroup>
      <p id="visibility-error" className="text-sm font-semibold text-danger">
        Choose who can see the deck.
      </p>
    </div>
  ),
};

export const ItemsOnly: Story = {
  render: (args) => (
    <RadioGroup {...args} className="flex gap-3">
      <RadioGroupItem value="due" aria-label="Due first" />
      <RadioGroupItem value="random" aria-label="Shuffled" />
    </RadioGroup>
  ),
};

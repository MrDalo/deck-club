import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#components/button';
import { Checkbox } from '#components/checkbox';
import { Input } from '#components/input';
import { NativeSelect, NativeSelectOption } from '#components/native-select';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '.';

const meta = {
  title: 'Components/Field',
  component: Field,
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal', 'responsive'] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Field {...args}>
      <FieldLabel htmlFor="title">Deck title</FieldLabel>
      <Input id="title" placeholder="Biology exam" aria-describedby="title-help" />
      <FieldDescription id="title-help">
        Shown on the deck tile and in your AI’s answers.
      </FieldDescription>
    </Field>
  ),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="title-invalid">Deck title</FieldLabel>
      <Input id="title-invalid" aria-invalid aria-describedby="title-error" defaultValue="" />
      <FieldError id="title-error">Give the deck a title.</FieldError>
    </Field>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="reminders" defaultChecked />
      <FieldContent>
        <FieldLabel htmlFor="reminders">Daily reminder</FieldLabel>
        <FieldDescription>An email at 8:00 when cards are due.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

export const ChoiceCards: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend variant="label">Who may add cards to this deck</FieldLegend>
      <FieldGroup className="gap-3">
        {[
          { id: 'me', title: 'Only me', text: 'Nobody else can change the deck.' },
          {
            id: 'ai',
            title: 'Me and my AI assistant',
            text: 'Claude, ChatGPT or Codex, through MCP.',
          },
          { id: 'club', title: 'The whole club', text: 'Every member can add and edit cards.' },
        ].map((choice, index) => (
          <FieldLabel key={choice.id} htmlFor={`who-${choice.id}`}>
            <Field orientation="horizontal">
              <Checkbox
                id={`who-${choice.id}`}
                aria-labelledby={`who-${choice.id}-title`}
                aria-describedby={`who-${choice.id}-text`}
                defaultChecked={index === 1}
              />
              <FieldContent>
                <FieldTitle id={`who-${choice.id}-title`}>{choice.title}</FieldTitle>
                <FieldDescription id={`who-${choice.id}-text`}>{choice.text}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </FieldGroup>
    </FieldSet>
  ),
};

export const Form: Story = {
  render: () => (
    <form className="grid gap-6" method="post" action="#">
      <FieldSet>
        <FieldLegend>New deck</FieldLegend>
        <FieldDescription>Add cards yourself or ask your AI assistant.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="deck-title">Title</FieldLabel>
            <Input id="deck-title" placeholder="Biology exam" />
          </Field>
          <Field>
            <FieldLabel htmlFor="deck-language">Language</FieldLabel>
            <NativeSelect id="deck-language" defaultValue="en">
              <NativeSelectOption value="en">English</NativeSelectOption>
              <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
              <NativeSelectOption value="cs">Čeština</NativeSelectOption>
            </NativeSelect>
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor="deck-import">Import a file</FieldLabel>
            <Input id="deck-import" type="file" accept=".csv,.apkg" />
            <FieldDescription>A Deck Club export or an Anki deck.</FieldDescription>
          </Field>
        </FieldGroup>
      </FieldSet>
      <Field orientation="horizontal">
        <Button type="submit">Create deck</Button>
        <Button variant="ghost">Cancel</Button>
      </Field>
    </form>
  ),
};

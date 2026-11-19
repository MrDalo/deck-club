import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.';

const FAQ = [
  {
    value: 'srs',
    question: 'What is spaced repetition?',
    answer: 'Deck Club shows a card again just before you would forget it, so reviews stay short.',
  },
  {
    value: 'ai',
    question: 'Can my AI assistant add cards?',
    answer: 'Yes. Connect Claude, ChatGPT or Codex through the Deck Club MCP server.',
  },
  {
    value: 'clubs',
    question: 'What is a club?',
    answer: 'A group that learns the same decks together and sees each other’s streaks.',
  },
];

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: { type: 'single', collapsible: true, className: 'max-w-lg' },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'cards'] } },
  render: (args) => (
    <Accordion {...args}>
      {FAQ.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};
export const Cards: Story = { args: { variant: 'cards' } };
export const OpenByDefault: Story = { args: { defaultValue: 'srs' } };
export const Multiple: Story = {
  args: { type: 'multiple', defaultValue: ['srs', 'ai'] },
};
export const DisabledItem: Story = {
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem value="srs">
        <AccordionTrigger>What is spaced repetition?</AccordionTrigger>
        <AccordionContent>Short reviews, right before you forget.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="battles" disabled>
        <AccordionTrigger>Battles (coming soon)</AccordionTrigger>
        <AccordionContent>Not built yet.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

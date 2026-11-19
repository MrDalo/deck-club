import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyIcon, RotateCcwIcon, SparklesIcon } from 'lucide-react';
import { Avatar } from '#components/avatar';
import { Button } from '#components/button';
import {
  Message,
  MessageActions,
  MessageContent,
  MessageHeader,
  MessageNotice,
  MessageTyping,
} from '.';

const SENT = new Date(2026, 10, 18, 9, 30);

const meta = {
  title: 'Components/Message',
  component: Message,
  argTypes: { align: { control: 'inline-radio', options: ['start', 'end'] } },
  decorators: [
    (Story) => (
      <div className="grid max-w-xl gap-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromClaude: Story = {
  render: (args) => (
    <Message {...args} avatar={<Avatar name="Claude" tone="mint" size="sm" />}>
      <MessageHeader author="Claude" time={SENT} locale="en" />
      <MessageContent tone="mint">
        I made a deck called “Biology exam” with 10 cards about cell division. Want me to add some
        about meiosis too?
      </MessageContent>
      <MessageActions>
        <Button size="sm">
          <SparklesIcon aria-hidden />
          Open the deck
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Copy message">
          <CopyIcon aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Ask again">
          <RotateCcwIcon aria-hidden />
        </Button>
      </MessageActions>
    </Message>
  ),
};

export const FromYou: Story = {
  render: (args) => (
    <Message {...args} align="end" avatar={<Avatar name="Jana Nováková" size="sm" />}>
      <MessageHeader author="You" time={SENT} locale="en" />
      <MessageContent tone="lilac">Make me a deck for my biology exam on Friday.</MessageContent>
    </Message>
  ),
};

export const Tones: Story = {
  render: () => (
    <>
      {(['card', 'lilac', 'mint', 'peach', 'rose', 'sky', 'butter'] as const).map((tone) => (
        <Message key={tone}>
          <MessageContent tone={tone}>A {tone} bubble.</MessageContent>
        </Message>
      ))}
    </>
  ),
};

export const Typing: Story = {
  render: () => (
    <Message avatar={<Avatar name="Claude" tone="mint" size="sm" />}>
      <MessageTyping label="Claude is typing" />
    </Message>
  ),
};

export const ClubChat: Story = {
  render: () => (
    <>
      <MessageNotice>Today</MessageNotice>
      <Message avatar={<Avatar name="Peter Horváth" size="sm" />}>
        <MessageHeader author="Peter" time={new Date(2026, 10, 18, 8, 5)} locale="sk" />
        <MessageContent>Kto si už dnes prešiel mitózu?</MessageContent>
      </Message>
      <MessageNotice>Jana joined the club</MessageNotice>
      <Message align="end" avatar={<Avatar name="Jana Nováková" size="sm" />}>
        <MessageHeader author="Ty" time={new Date(2026, 10, 18, 8, 12)} locale="sk" />
        <MessageContent tone="lilac">Ja! 42 kariet, streak 14 dní.</MessageContent>
      </Message>
    </>
  ),
};

export const LongText: Story = {
  render: () => (
    <Message avatar={<Avatar name="Claude" tone="mint" size="sm" />}>
      <MessageContent tone="mint">
        {
          'Here are the cards:\n\n1. Mitosis: two identical daughter cells.\n2. Meiosis: four gametes.\n3. Cytokinesis: the cytoplasm divides.\n\nhttps://deck.club/decks/biology-exam-with-a-very-long-address-that-wraps'
        }
      </MessageContent>
    </Message>
  ),
};

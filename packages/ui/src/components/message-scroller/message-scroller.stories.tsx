import type { Meta, StoryObj } from '@storybook/react-vite';
import { SendHorizontalIcon } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '#components/avatar';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#components/input-group';
import {
  Message,
  MessageContent,
  MessageHeader,
  MessageNotice,
  MessageTyping,
} from '#components/message';
import { MessageScroller } from '.';

type Line = { id: number; from: 'you' | 'claude'; text: string };

const OPENING: Line[] = [
  { id: 1, from: 'you', text: 'Make me a deck for my biology exam.' },
  { id: 2, from: 'claude', text: 'Done: “Biology exam” with 10 cards about cell division.' },
  { id: 3, from: 'you', text: 'Add some about meiosis.' },
  { id: 4, from: 'claude', text: 'Added 6 cards about meiosis. The deck has 16 cards now.' },
  { id: 5, from: 'you', text: 'Which cards are due today?' },
  {
    id: 6,
    from: 'claude',
    text: '12 cards are due. The hardest one is “What happens in prophase I?”.',
  },
  { id: 7, from: 'you', text: 'Quiz me on that one.' },
  {
    id: 8,
    from: 'claude',
    text: 'In prophase I, homologous chromosomes pair up and cross over. Ready?',
  },
];

function Line({ line }: { line: Line }): React.JSX.Element {
  const mine = line.from === 'you';
  return (
    <Message
      align={mine ? 'end' : 'start'}
      avatar={
        mine ? (
          <Avatar name="Jana Nováková" size="sm" />
        ) : (
          <Avatar name="Claude" tone="mint" size="sm" />
        )
      }
    >
      <MessageHeader author={mine ? 'You' : 'Claude'} />
      <MessageContent tone={mine ? 'lilac' : 'mint'}>{line.text}</MessageContent>
    </Message>
  );
}

const meta = {
  title: 'Components/Message Scroller',
  component: MessageScroller,
  args: { label: 'Conversation with Claude', latestLabel: 'Jump to latest' },
} satisfies Meta<typeof MessageScroller>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
  render: (args) => (
    <MessageScroller
      {...args}
      className="h-96 max-w-xl rounded-card border-2 border-ink bg-paper shadow-sticker-sm"
    >
      <MessageNotice>Today</MessageNotice>
      {OPENING.map((line) => (
        <Line key={line.id} line={line} />
      ))}
    </MessageScroller>
  ),
};

export const Chat: Story = {
  render: (args) => {
    const [lines, setLines] = useState(OPENING.slice(0, 4));
    const [draft, setDraft] = useState('');
    const [typing, setTyping] = useState(false);
    const send = (): void => {
      if (draft.trim() === '') return;
      setLines((current) => [...current, { id: current.length + 1, from: 'you', text: draft }]);
      setDraft('');
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setLines((current) => [
          ...current,
          {
            id: current.length + 1,
            from: 'claude',
            text: 'Good question. I added a card about it.',
          },
        ]);
      }, 1200);
    };
    return (
      <div className="flex h-[28rem] max-w-xl flex-col overflow-hidden rounded-card border-2 border-ink bg-paper shadow-sticker-sm">
        <MessageScroller {...args} className="flex-1">
          {lines.map((line) => (
            <Line key={line.id} line={line} />
          ))}
          {typing && (
            <Message avatar={<Avatar name="Claude" tone="mint" size="sm" />}>
              <MessageTyping label="Claude is typing" />
            </Message>
          )}
        </MessageScroller>
        <form
          className="border-t-2 border-ink bg-card p-3"
          method="post"
          action="#"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <InputGroup>
            <InputGroupInput
              aria-label="Message Claude"
              placeholder="Ask Claude about your decks"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" size="sm">
                Send
                <SendHorizontalIcon aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from '#components/input';
import { MarkedText, Marker } from '.';

const TONES = ['butter', 'lilac', 'mint', 'peach', 'rose', 'sky'] as const;

const CARDS = [
  { front: 'Mitosis', back: 'Cell division into two identical daughter cells.' },
  { front: 'Meiosis', back: 'Cell division into four gametes with half the chromosomes.' },
  { front: 'Café', back: 'A place to drink coffee and review your cards.' },
];

const meta = {
  title: 'Components/Marker',
  component: Marker,
  args: { children: 'cell division' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'inline-radio', options: ['swipe', 'underline'] },
    as: { control: 'inline-radio', options: ['mark', 'span'] },
  },
  render: (args) => (
    <p className="text-lg">
      Ask Claude to add 10 cards about <Marker {...args} />.
    </p>
  ),
} satisfies Meta<typeof Marker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Swipe: Story = {};
export const Underline: Story = { args: { variant: 'underline' } };

export const Tones: Story = {
  render: (args) => (
    <div className="grid gap-2 text-lg">
      {TONES.map((tone) => (
        <p key={tone}>
          <Marker {...args} tone={tone}>
            {tone}
          </Marker>{' '}
          highlighter
        </p>
      ))}
    </div>
  ),
};

export const Heading: Story = {
  render: () => (
    <h1 className="font-display text-4xl font-extrabold">
      <Marker as="span">Your decks</Marker>
    </h1>
  ),
};

export const DeckHeading: Story = {
  render: () => (
    <h1 className="font-display text-4xl font-extrabold">
      <Marker as="span" tone="mint">
        Biology exam
      </Marker>
    </h1>
  ),
};

export const SearchResults: Story = {
  render: () => {
    const [query, setQuery] = useState('cell cafe');
    return (
      <div className="grid max-w-md gap-4">
        <Input
          aria-label="Search cards"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="grid gap-3">
          {CARDS.map((card) => (
            <li
              key={card.front}
              className="rounded-2xl border-2 border-ink bg-card p-4 shadow-sticker-sm"
            >
              <p className="font-display text-lg font-bold">
                <MarkedText text={card.front} query={query} />
              </p>
              <p className="text-ink-soft">
                <MarkedText text={card.back} query={query} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};

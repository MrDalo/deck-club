import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '#components/separator';
import { ScrollArea, ScrollBar } from '.';

const CARDS = Array.from({ length: 24 }, (_, index) => `Card ${index + 1}`);

const meta = {
  title: 'Components/Scroll Area',
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LongText: Story = {
  args: {
    label: 'Answer',
    className: 'ruled h-48 w-72 rounded-card border-2 border-ink shadow-sticker-sm',
  },
  render: (args) => (
    <ScrollArea {...args}>
      <p className="px-5 pt-12 pb-4 leading-8">
        Mitosis is cell division that makes two identical daughter cells. It runs through prophase,
        metaphase, anaphase and telophase, then cytokinesis splits the cytoplasm. Each daughter cell
        gets a full copy of the chromosomes, so body tissue can grow and repair itself without
        changing the genetic information. Meiosis, by contrast, halves the chromosome number to make
        gametes.
      </p>
    </ScrollArea>
  ),
};

export const List: Story = {
  render: () => (
    <ScrollArea className="h-60 w-56 rounded-card border-2 border-ink bg-card">
      <ul className="p-3">
        {CARDS.map((card, index) => (
          <li key={card}>
            {index > 0 && <Separator className="my-1" />}
            <button
              type="button"
              className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-butter"
            >
              {card}
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea label="Recent decks" className="w-80 rounded-card border-2 border-ink bg-card">
      <div className="flex w-max gap-3 p-3">
        {['Biology', 'Spanish', 'Chemistry', 'History', 'Physics', 'Latin'].map((deck) => (
          <div
            key={deck}
            className="grid h-24 w-32 place-items-center rounded-xl border-2 border-ink bg-paper font-bold"
          >
            {deck}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

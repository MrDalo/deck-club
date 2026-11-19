import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardContent, CardHeader, CardTitle } from '#components/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselStatus,
} from '.';

const CARDS = [
  { front: 'Mitosis', back: 'Cell division into two identical daughter cells.' },
  { front: 'Meiosis', back: 'Division into four gametes with half the chromosomes.' },
  { front: 'Osmosis', back: 'Water crossing a membrane towards more solute.' },
  { front: 'Diffusion', back: 'Particles spreading from high to low concentration.' },
  { front: 'Ribosome', back: 'Where the cell builds proteins.' },
];

const ACCENTS = ['lilac', 'mint', 'peach', 'sky', 'butter'] as const;

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  args: { label: 'Cards in Biology exam' },
  argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
  render: (args) => (
    <div className="mx-14 max-w-sm">
      <Carousel {...args}>
        <CarouselContent>
          {CARDS.map((card, index) => (
            <CarouselItem key={card.front} aria-label={`${index + 1} of ${CARDS.length}`}>
              <Card variant="ruled" className="h-56">
                <CardHeader>
                  <CardTitle>{card.front}</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 leading-8">{card.back}</CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label="Previous card" />
        <CarouselNext label="Next card" />
        <CarouselStatus className="mt-4" format={(current, total) => `${current} / ${total}`} />
      </Carousel>
    </div>
  ),
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flashcards: Story = {};
export const Loop: Story = { args: { opts: { loop: true } } };

export const SeveralPerView: Story = {
  render: (args) => (
    <div className="mx-14 max-w-2xl">
      <Carousel {...args} label="Your decks" opts={{ align: 'start' }}>
        <CarouselContent>
          {CARDS.map((card, index) => (
            <CarouselItem key={card.front} className="basis-1/2 md:basis-1/3">
              <Card
                accent={ACCENTS[index % ACCENTS.length] ?? 'lilac'}
                interactive
                className="my-1"
              >
                <CardHeader>
                  <CardTitle>{card.front}</CardTitle>
                </CardHeader>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label="Previous decks" />
        <CarouselNext label="Next decks" />
      </Carousel>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical', opts: { align: 'start' } },
  render: (args) => (
    <div className="my-14 w-72">
      <Carousel {...args}>
        <CarouselContent className="h-64">
          {CARDS.map((card) => (
            <CarouselItem key={card.front} className="basis-1/2">
              <Card variant="flat" className="h-full justify-center">
                <CardHeader>
                  <CardTitle>{card.front}</CardTitle>
                </CardHeader>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious label="Previous card" />
        <CarouselNext label="Next card" />
      </Carousel>
    </div>
  ),
};

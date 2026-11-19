import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselStatus,
  type CarouselApi,
} from '.';

const CARDS = ['Mitosis', 'Meiosis', 'Osmosis'];

function Cards({ setApi }: { setApi?: (api: CarouselApi) => void }): React.JSX.Element {
  return (
    <Carousel label="Karty v balíčku Biológia" {...(setApi === undefined ? {} : { setApi })}>
      <CarouselContent>
        {CARDS.map((card, index) => (
          <CarouselItem key={card} aria-label={`${index + 1} z ${CARDS.length}`}>
            {card}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious label="Predchádzajúca karta" />
      <CarouselNext label="Ďalšia karta" />
      <CarouselStatus format={(current, total) => `${current} / ${total}`} />
    </Carousel>
  );
}

describe('Carousel', () => {
  it('is a named carousel region of named slides', () => {
    render(<Cards />);
    const region = screen.getByRole('region', { name: 'Karty v balíčku Biológia' });

    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getByRole('group', { name: '2 z 3' })).toHaveAttribute(
      'aria-roledescription',
      'slide',
    );
  });

  it('names its buttons in the page’s language, not shadcn’s English', () => {
    render(<Cards />);

    expect(screen.getByRole('button', { name: 'Predchádzajúca karta' })).toHaveClass('bg-card');
    expect(screen.getByRole('button', { name: 'Ďalšia karta' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
  });

  it('hands the carousel API to the caller and moves with the arrow keys', async () => {
    const setApi = vi.fn<(api: CarouselApi) => void>();
    render(<Cards setApi={setApi} />);
    await waitFor(() => expect(setApi).toHaveBeenCalled());
    const api = setApi.mock.calls.at(-1)?.[0];
    const scrollNext = vi.spyOn(api!, 'scrollNext');
    const scrollPrev = vi.spyOn(api!, 'scrollPrev');

    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowLeft' });

    expect(scrollNext).toHaveBeenCalledOnce();
    expect(scrollPrev).toHaveBeenCalledOnce();
  });

  it('announces the position through the caller’s format', async () => {
    render(<Cards />);
    const status = await screen.findByText(/^1 \/ \d+$/);

    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('keeps the nav buttons centred when pressed', () => {
    render(<Cards />);
    expect(screen.getByRole('button', { name: 'Ďalšia karta' })).toHaveClass(
      'group-data-[orientation=horizontal]/carousel:active:-translate-y-1/2',
    );
    expect(screen.getByRole('region')).toHaveAttribute('data-orientation', 'horizontal');
  });
});

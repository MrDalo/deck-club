import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkedText, Marker } from '.';

describe('Marker', () => {
  it('is a mark with the Butter highlighter swipe by default', () => {
    render(<Marker>cell division</Marker>);
    const mark = screen.getByText('cell division');

    expect(mark.tagName).toBe('MARK');
    expect(mark).toHaveClass('highlight', 'bg-transparent');
    expect(mark).toHaveStyle({ '--highlight': 'var(--color-butter)' });
  });

  it('takes another pastel and the underline stroke', () => {
    render(
      <Marker tone="mint" variant="underline">
        Good
      </Marker>,
    );
    const mark = screen.getByText('Good');

    expect(mark).toHaveStyle({ '--highlight': 'var(--color-mint)' });
    expect(mark).toHaveClass('underline');
    expect(mark).not.toHaveClass('highlight');
  });

  it('is a plain span when it only decorates', () => {
    render(<Marker as="span">Your decks</Marker>);
    expect(screen.getByText('Your decks').tagName).toBe('SPAN');
  });
});

describe('MarkedText', () => {
  it('marks the search words, ignoring accents, and keeps the text whole', () => {
    const { container } = render(<MarkedText text="Mitóza je delenie bunky" query="mitoza bunk" />);

    expect(container).toHaveTextContent('Mitóza je delenie bunky');
    expect(Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent)).toEqual([
      'Mitóza',
      'bunk',
    ]);
  });

  it('marks nothing for a blank search', () => {
    const { container } = render(<MarkedText text="Mitosis" query="  " />);
    expect(container.querySelector('mark')).toBeNull();
  });

  it('shows markup in the text as text, never as HTML', () => {
    const { container } = render(<MarkedText text="<b>cell</b>" query="cell" />);

    expect(container.querySelector('b')).toBeNull();
    expect(container).toHaveTextContent('<b>cell</b>');
  });

  it('passes its tone to every mark', () => {
    const { container } = render(<MarkedText text="cell and cell" query="cell" tone="sky" />);
    for (const mark of container.querySelectorAll('mark'))
      expect(mark).toHaveStyle({ '--highlight': 'var(--color-sky)' });
  });
});

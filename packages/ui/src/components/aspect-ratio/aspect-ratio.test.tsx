import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AspectRatio } from '.';

describe('AspectRatio', () => {
  it('frames its content in a sticker card at the given ratio', () => {
    render(
      <AspectRatio ratio={2}>
        <img alt="Cell diagram" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
      </AspectRatio>,
    );
    const frame = screen.getByRole('img', { name: 'Cell diagram' }).parentElement;

    expect(frame).toHaveClass('rounded-card', 'border-ink', '[&>img]:object-cover');
    expect(frame?.parentElement).toHaveStyle({ paddingBottom: '50%' });
  });

  it('draws a ruled placeholder or no frame', () => {
    const { container, rerender } = render(<AspectRatio frame="ruled" />);
    expect(container.querySelector('[data-slot="aspect-ratio"]')).toHaveClass('ruled');

    rerender(<AspectRatio frame="none" />);
    expect(container.querySelector('[data-slot="aspect-ratio"]')).not.toHaveClass('border-ink');
  });
});

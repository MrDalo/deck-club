import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '#components/button';
import { ButtonGroup, ButtonGroupText } from '.';

describe('ButtonGroup', () => {
  it('groups its buttons under one accessible name', () => {
    render(
      <ButtonGroup aria-label="Rate this card">
        <Button>Again</Button>
        <Button>Good</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'Rate this card' });

    expect(group).toHaveClass('shadow-sticker-sm', '[&>*]:shadow-none');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('joins buttons: one shared outline between neighbours', () => {
    render(<ButtonGroup aria-label="Pages" />);
    expect(screen.getByRole('group')).toHaveClass(
      '[&>*:not(:first-child)]:border-l-0',
      '[&>*:not(:last-child)]:rounded-r-none',
    );
  });

  it('stacks vertically', () => {
    render(<ButtonGroup aria-label="Sort" orientation="vertical" />);
    const group = screen.getByRole('group');

    expect(group).toHaveAttribute('data-orientation', 'vertical');
    expect(group).toHaveClass('flex-col');
  });

  it('shows a plain label in the brand', () => {
    render(<ButtonGroupText>12 cards</ButtonGroupText>);
    expect(screen.getByText('12 cards')).toHaveClass('border-ink', 'bg-paper');
  });
});

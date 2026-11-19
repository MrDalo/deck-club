import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '.';

function Pager(): React.JSX.Element {
  return (
    <Pagination label="Stránky">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious label="Predchádzajúca" href="#1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext label="Ďalšia" href="#3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe('Pagination', () => {
  it('is a navigation named in the page’s language', () => {
    render(<Pager />);
    expect(screen.getByRole('navigation', { name: 'Stránky' })).toBeInTheDocument();
  });

  it('marks the current page as a Lilac sticker', () => {
    render(<Pager />);
    const current = screen.getByRole('link', { name: '2' });

    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('bg-lilac', 'border-ink');
    expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute('aria-current');
  });

  it('names previous and next in the page’s language, even where only the arrow shows', () => {
    render(<Pager />);

    expect(screen.getByRole('link', { name: 'Predchádzajúca' })).toHaveAttribute('href', '#1');
    expect(screen.getByRole('link', { name: 'Ďalšia' })).toHaveAttribute('href', '#3');
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
  });
});

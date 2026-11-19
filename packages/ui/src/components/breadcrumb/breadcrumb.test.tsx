import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '.';

function Trail(): React.JSX.Element {
  return (
    <Breadcrumb label="Navigačná cesta">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/decks">Balíčky</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Biológia</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe('Breadcrumb', () => {
  it('is a navigation landmark named in the page’s language', () => {
    render(<Trail />);
    expect(screen.getByRole('navigation', { name: 'Navigačná cesta' })).toBeInTheDocument();
  });

  it('links earlier levels and marks the current page', () => {
    render(<Trail />);

    expect(screen.getByRole('link', { name: 'Balíčky' })).toHaveAttribute('href', '/decks');
    expect(screen.getByText('Biológia')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Biológia')).toHaveClass('text-ink', 'font-bold');
  });

  it('keeps links readable in Ink soft with the brand focus outline', () => {
    render(<Trail />);
    expect(screen.getByRole('link', { name: 'Balíčky' })).toHaveClass(
      'text-ink-soft',
      'focus-visible:outline-focus',
    );
  });

  it('hides separators from assistive technology', () => {
    const { container } = render(<Trail />);
    expect(container.querySelector('[data-slot="breadcrumb-separator"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});

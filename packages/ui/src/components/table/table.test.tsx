import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '.';

function Scores({ variant }: { variant?: 'sticker' | 'plain' }): React.JSX.Element {
  return (
    <Table {...(variant === undefined ? {} : { variant })}>
      <TableCaption>This week</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Reviews</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>Jana</TableCell>
          <TableCell>120</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe('Table', () => {
  it('is a table named by its caption', () => {
    render(<Scores />);
    expect(screen.getByRole('table', { name: 'This week' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Reviews' })).toHaveClass('font-bold');
  });

  it('sits in a sticker frame unless plain', () => {
    const { container, rerender } = render(<Scores />);
    expect(container.querySelector('[data-slot="table-frame"]')).toHaveClass(
      'border-ink',
      'rounded-card',
    );

    rerender(<Scores variant="plain" />);
    expect(container.querySelector('[data-slot="table-frame"]')).toBeNull();
  });

  it('washes a selected row Lilac', () => {
    render(<Scores />);
    expect(screen.getByRole('row', { name: 'Jana 120' })).toHaveClass(
      'data-[state=selected]:bg-lilac/30',
    );
  });
});

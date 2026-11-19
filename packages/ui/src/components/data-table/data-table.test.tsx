import type { ColumnDef } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createSelectColumn, DataTable, DataTableColumnHeader, DataTableFilter } from '.';
import { CARD_ROWS, PLAIN_COLUMNS, type CardRow } from './fixtures';

const SORTABLE: ColumnDef<CardRow>[] = [
  {
    accessorKey: 'front',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Front" />,
  },
  { accessorKey: 'back', header: 'Back', enableSorting: false },
];

const PAGER = {
  navigation: 'Pages',
  previous: 'Previous',
  next: 'Next',
  page: (page: number, count: number) => `Page ${page} of ${count}`,
};

const bodyRows = (): HTMLElement[] =>
  within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row');

describe('DataTable', () => {
  it('is a named table with a row per item', () => {
    render(
      <DataTable label="Cards" columns={PLAIN_COLUMNS} data={CARD_ROWS} emptyMessage="No cards." />,
    );

    expect(screen.getByRole('table', { name: 'Cards' })).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(5);
    expect(screen.getByRole('columnheader', { name: 'Front' })).toBeInTheDocument();
  });

  it('says so when there are no rows', () => {
    render(
      <DataTable label="Cards" columns={PLAIN_COLUMNS} data={[]} emptyMessage="No cards yet." />,
    );
    expect(screen.getByRole('cell', { name: 'No cards yet.' })).toHaveAttribute('colspan', '2');
  });

  it('sorts by a column and announces the order', async () => {
    const user = userEvent.setup();
    render(<DataTable label="Cards" columns={SORTABLE} data={CARD_ROWS} emptyMessage="None" />);
    const header = screen.getByRole('columnheader', { name: 'Front' });

    expect(header).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: 'Back' })).not.toHaveAttribute('aria-sort');

    await user.click(within(header).getByRole('button', { name: 'Front' }));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyRows()[0]).toHaveTextContent('Diffusion');

    await user.click(within(header).getByRole('button', { name: 'Front' }));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(bodyRows()[0]).toHaveTextContent('Ribosome');
  });

  it('filters a column from the toolbar', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        label="Cards"
        columns={PLAIN_COLUMNS}
        data={CARD_ROWS}
        emptyMessage="No card matches."
        toolbar={(table) => <DataTableFilter table={table} columnId="front" label="Search cards" />}
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search cards' }), 'osis');
    expect(bodyRows().map((row) => row.firstElementChild?.textContent)).toEqual([
      'Mitosis',
      'Meiosis',
      'Osmosis',
    ]);

    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No card matches.')).toBeInTheDocument();
  });

  it('pages through rows with translated labels', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        label="Cards"
        columns={PLAIN_COLUMNS}
        data={CARD_ROWS}
        emptyMessage="None"
        pageSize={2}
        pagination={PAGER}
      />,
    );
    const pager = screen.getByRole('navigation', { name: 'Pages' });

    expect(bodyRows()).toHaveLength(2);
    expect(within(pager).getByText('Page 1 of 3')).toBeInTheDocument();
    expect(within(pager).getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(within(pager).getByRole('button', { name: 'Next' }));
    await user.click(within(pager).getByRole('button', { name: 'Next' }));
    expect(within(pager).getByText('Page 3 of 3')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(1);
    expect(within(pager).getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('selects rows, and all of them from the header', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        label="Cards"
        getRowId={(row) => row.id}
        columns={[
          createSelectColumn<CardRow>({
            selectAllLabel: 'Select all cards',
            selectRowLabel: (row) => `Select ${row.front}`,
          }),
          ...PLAIN_COLUMNS,
        ]}
        data={CARD_ROWS}
        emptyMessage="None"
        toolbar={(table) => <p>{table.getSelectedRowModel().rows.length} selected</p>}
      />,
    );
    const all = screen.getByRole('checkbox', { name: 'Select all cards' });

    await user.click(screen.getByRole('checkbox', { name: 'Select Osmosis' }));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(all).toHaveAttribute('aria-checked', 'mixed');
    expect(bodyRows()[2]).toHaveAttribute('data-state', 'selected');

    await user.click(all);
    expect(screen.getByText('5 selected')).toBeInTheDocument();
    expect(all).toBeChecked();
  });
});

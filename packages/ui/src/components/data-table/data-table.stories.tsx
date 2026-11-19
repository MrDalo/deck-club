import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import { SparklesIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '#components/badge';
import { Button } from '#components/button';
import { createSelectColumn, DataTable, DataTableColumnHeader, DataTableFilter } from '.';
import { CARD_ROWS, PLAIN_COLUMNS, type CardRow } from './fixtures';

/** The fixture cards five times over: enough rows to page through. */
const MANY_ROWS: CardRow[] = Array.from({ length: 5 }, (_, round) =>
  CARD_ROWS.map((card) => ({
    ...card,
    id: `${card.id}-${round}`,
    front: `${card.front} ${round + 1}`,
    due: (card.due + round) % 7,
  })),
).flat();

const dueText = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};

const COLUMNS: ColumnDef<CardRow>[] = [
  {
    accessorKey: 'front',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Front" />,
    cell: ({ row }) => <span className="font-semibold">{row.original.front}</span>,
  },
  { accessorKey: 'back', header: 'Back', enableSorting: false },
  {
    accessorKey: 'due',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due" />,
    cell: ({ row }) => (
      <Badge tone={row.original.due === 0 ? 'butter' : 'paper'}>{dueText(row.original.due)}</Badge>
    ),
  },
  {
    accessorKey: 'author',
    header: 'Added by',
    enableSorting: false,
    cell: ({ row }) =>
      row.original.author === 'Claude' ? (
        <Badge tone="mint">
          <SparklesIcon aria-hidden />
          Claude
        </Badge>
      ) : (
        'You'
      ),
  },
];

const PAGER = {
  navigation: 'Pages',
  previous: 'Previous',
  next: 'Next',
  page: (page: number, count: number) => `Page ${page} of ${count}`,
};

const meta = {
  title: 'Components/Data Table',
  component: DataTable,
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <DataTable
      label="Cards in Biology exam"
      columns={PLAIN_COLUMNS}
      data={CARD_ROWS}
      emptyMessage="No cards yet."
    />
  ),
};

export const Sortable: Story = {
  render: () => (
    <DataTable
      label="Cards in Biology exam"
      columns={COLUMNS}
      data={CARD_ROWS}
      emptyMessage="No cards yet."
    />
  ),
};

export const FilterAndPages: Story = {
  render: () => (
    <DataTable
      label="Cards in Biology exam"
      columns={COLUMNS}
      data={MANY_ROWS}
      emptyMessage="No card matches your search."
      pageSize={5}
      pagination={PAGER}
      toolbar={(table) => (
        <DataTableFilter
          table={table}
          columnId="front"
          label="Search cards"
          placeholder="Search cards"
        />
      )}
    />
  ),
};

export const Selection: Story = {
  render: () => (
    <DataTable
      label="Cards in Biology exam"
      getRowId={(row) => row.id}
      columns={[
        createSelectColumn<CardRow>({
          selectAllLabel: 'Select all cards on this page',
          selectRowLabel: (row) => `Select ${row.front}`,
        }),
        ...COLUMNS,
      ]}
      data={MANY_ROWS}
      emptyMessage="No cards yet."
      pageSize={6}
      pagination={PAGER}
      toolbar={(table) => {
        const count = table.getSelectedRowModel().rows.length;
        return (
          <div className="flex min-h-11 items-center justify-between gap-3">
            <DataTableFilter
              table={table}
              columnId="front"
              label="Search cards"
              placeholder="Search cards"
            />
            {count > 0 && (
              <Button variant="danger" size="sm">
                <Trash2Icon aria-hidden />
                Delete {count} {count === 1 ? 'card' : 'cards'}
              </Button>
            )}
          </div>
        );
      }}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable
      label="Cards in Biology exam"
      columns={COLUMNS}
      data={[]}
      emptyMessage="No cards yet. Add one, or ask your AI assistant to make some."
    />
  ),
};

import type { ColumnDef } from '@tanstack/react-table';

/** A card as a table row, for the tests and stories. */
export type CardRow = {
  id: string;
  front: string;
  back: string;
  due: number;
  author: 'You' | 'Claude';
};

export const CARD_ROWS: CardRow[] = [
  { id: 'c1', front: 'Mitosis', back: 'Two identical daughter cells', due: 0, author: 'You' },
  {
    id: 'c2',
    front: 'Meiosis',
    back: 'Four gametes, half the chromosomes',
    due: 2,
    author: 'Claude',
  },
  { id: 'c3', front: 'Osmosis', back: 'Water crossing a membrane', due: 1, author: 'Claude' },
  { id: 'c4', front: 'Diffusion', back: 'From high to low concentration', due: 5, author: 'You' },
  { id: 'c5', front: 'Ribosome', back: 'Where proteins are built', due: 3, author: 'Claude' },
];

export const PLAIN_COLUMNS: ColumnDef<CardRow>[] = [
  { accessorKey: 'front', header: 'Front' },
  { accessorKey: 'back', header: 'Back' },
];

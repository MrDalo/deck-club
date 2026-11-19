import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '#components/checkbox';

type SelectColumnLabels<TData> = {
  /** The header box's name, translated ("Select all cards on this page"). */
  selectAllLabel: string;
  /** Each row box's name, translated, from the row ("Select Mitosis"). */
  selectRowLabel: (row: TData) => string;
};

/**
 * A first column of checkboxes for choosing rows. The header box selects
 * the whole page and shows a dash when only some rows are chosen.
 * @param labels - the boxes' translated names
 * @returns the column definition
 */
export function createSelectColumn<TData>({
  selectAllLabel,
  selectRowLabel,
}: SelectColumnLabels<TData>): ColumnDef<TData> {
  return {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={selectAllLabel}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
        }
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={selectRowLabel(row.original)}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
  };
}

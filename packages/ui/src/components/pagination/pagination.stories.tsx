import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from '.';

function Pager({ total, initial }: { total: number; initial: number }): React.JSX.Element {
  const [page, setPage] = useState(initial);
  const go = (next: number) => (event: React.MouseEvent) => {
    event.preventDefault();
    setPage(Math.min(Math.max(next, 1), total));
  };
  return (
    <Pagination label="Pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious label="Previous" href={`#page-${page - 1}`} onClick={go(page - 1)} />
        </PaginationItem>
        {paginationRange(page, total).map((item) =>
          typeof item === 'number' ? (
            <PaginationItem key={item}>
              <PaginationLink href={`#page-${item}`} isActive={item === page} onClick={go(item)}>
                {item}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationEllipsis />
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext label="Next" href={`#page-${page + 1}`} onClick={go(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  args: { label: 'Pages' },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FewPages: Story = { render: () => <Pager total={5} initial={2} /> };
export const ManyPages: Story = { render: () => <Pager total={20} initial={10} /> };
export const NearTheEnd: Story = { render: () => <Pager total={20} initial={19} /> };

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Attachment } from '.';

describe('Attachment', () => {
  it('shows the file name and its size in the given locale', () => {
    render(<Attachment name="Biology.apkg" size={1_500_000} locale="sk" />);

    expect(screen.getByText('Biology.apkg')).toBeInTheDocument();
    expect(screen.getByText('1,5 MB')).toBeInTheDocument();
  });

  it('picks the icon tile from the file kind', () => {
    const { container } = render(<Attachment name="cell.png" type="image/png" />);
    const tile = container.querySelector('[aria-hidden="true"]');

    expect(tile).toHaveClass('bg-sky', 'border-ink');
  });

  it('shows upload progress named after the file', () => {
    render(<Attachment name="deck.csv" status="uploading" progress={45} locale="en" />);
    const bar = screen.getByRole('progressbar', { name: 'deck.csv' });

    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('replaces the size with the error and marks the row in Danger', () => {
    const { container } = render(
      <Attachment name="deck.csv" size={2048} status="error" error="Not a Deck Club export." />,
    );

    expect(screen.getByText('Not a Deck Club export.')).toHaveClass('text-danger');
    expect(screen.queryByText(/kB/)).not.toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-status', 'error');
  });

  it('removes with a translated label', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(<Attachment name="deck.csv" onRemove={onRemove} removeLabel="Odstrániť deck.csv" />);

    await user.click(screen.getByRole('button', { name: 'Odstrániť deck.csv' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('has no remove button without onRemove', () => {
    render(<Attachment name="deck.csv" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('links the name when given an href', () => {
    render(<Attachment name="notes.pdf" href="/files/notes.pdf" />);
    expect(screen.getByRole('link', { name: 'notes.pdf' })).toHaveAttribute(
      'href',
      '/files/notes.pdf',
    );
  });

  it('draws a compact chip without the size', () => {
    const { container } = render(<Attachment name="cell.png" size={2048} variant="chip" />);

    expect(container.firstChild).toHaveClass('rounded-full', 'h-10');
    expect(screen.queryByText(/kB/)).not.toBeInTheDocument();
  });
});

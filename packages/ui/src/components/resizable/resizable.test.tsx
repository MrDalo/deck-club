import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '.';

describe('Resizable', () => {
  it('divides panels with a named, focusable separator', () => {
    render(
      <ResizablePanelGroup orientation="horizontal" variant="sticker">
        <ResizablePanel defaultSize="35%">Cards</ResizablePanel>
        <ResizableHandle label="Resize the card list" withHandle />
        <ResizablePanel>Editor</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator', { name: 'Resize the card list' });

    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('tabindex', '0');
    expect(handle).toHaveClass('focus-visible:outline-focus');
    expect(screen.getByText('Cards').closest('[data-group]')).toHaveClass(
      'border-ink',
      'rounded-card',
    );
  });
});

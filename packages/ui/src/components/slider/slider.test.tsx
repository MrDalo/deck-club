import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from '.';

describe('Slider', () => {
  it('names its thumb and moves with the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider
        thumbLabels="New cards a day"
        defaultValue={[20]}
        max={50}
        onValueChange={onValueChange}
      />,
    );
    const thumb = screen.getByRole('slider', { name: 'New cards a day' });

    thumb.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}{End}');
    expect(onValueChange).toHaveBeenCalledWith([21]);
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
  });

  it('names each thumb of a range in the page’s language, not Radix’s English', () => {
    render(<Slider thumbLabels={['Najmenej', 'Najviac']} defaultValue={[10, 40]} />);

    expect(screen.getByRole('slider', { name: 'Najmenej' })).toHaveAttribute('aria-valuenow', '10');
    expect(screen.getByRole('slider', { name: 'Najviac' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.queryByRole('slider', { name: 'Minimum' })).not.toBeInTheDocument();
  });

  it('has one thumb by default', () => {
    render(<Slider thumbLabels="Volume" />);
    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });

  it('draws sticker thumbs on an Ink-outlined track', () => {
    const { container } = render(<Slider thumbLabels="Volume" />);

    expect(container.querySelector('[data-slot="slider-track"]')).toHaveClass('border-ink');
    expect(screen.getByRole('slider')).toHaveClass('shadow-sticker-sm', 'border-ink');
  });
});

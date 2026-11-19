import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd, KbdGroup } from '.';

describe('Kbd', () => {
  it('is a kbd element drawn as an Ink keycap', () => {
    render(<Kbd>K</Kbd>);
    const key = screen.getByText('K');

    expect(key.tagName).toBe('KBD');
    expect(key).toHaveClass('border-ink', 'border-b-[3px]', 'text-ink', 'bg-card');
  });

  it('groups keys in a kbd element', () => {
    render(
      <KbdGroup>
        <Kbd>⌘</Kbd>+<Kbd>K</Kbd>
      </KbdGroup>,
    );
    expect(screen.getByText('⌘').parentElement?.tagName).toBe('KBD');
  });
});

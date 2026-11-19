import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { pastelFor } from '#lib/pastel';
import { Avatar, AvatarGroup } from '.';

describe('Avatar', () => {
  it('is announced once, by name, with decorative initials', () => {
    render(<Avatar name="Jana Nováková" />);
    const avatar = screen.getByRole('img', { name: 'Jana Nováková' });

    expect(avatar).toHaveClass('border-2', 'border-ink', 'size-10');
    expect(screen.getByText('JN')).toHaveAttribute('aria-hidden', 'true');
  });

  it('gives the same name the same pastel', () => {
    render(<Avatar name="Jana Nováková" />);
    expect(screen.getByText('JN')).toHaveClass(`bg-${pastelFor('Jana Nováková')}`);
  });

  it('takes an explicit tone and size', () => {
    render(<Avatar name="Claude" tone="mint" size="xl" />);
    expect(screen.getByRole('img')).toHaveClass('size-20');
    expect(screen.getByText('C')).toHaveClass('bg-mint');
  });

  it('keeps the initials until the picture loads', () => {
    render(<Avatar name="Jana Nováková" src="/jana.png" />);
    expect(screen.getByText('JN')).toBeInTheDocument();
  });
});

describe('AvatarGroup', () => {
  it('groups avatars under a name', () => {
    render(
      <AvatarGroup aria-label="Club members">
        <Avatar name="Jana" />
        <Avatar name="Peter" />
      </AvatarGroup>,
    );
    expect(screen.getByRole('group', { name: 'Club members' })).toContainElement(
      screen.getByRole('img', { name: 'Peter' }),
    );
  });
});

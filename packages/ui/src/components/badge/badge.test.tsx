import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '.';

describe('Badge', () => {
  it('is a soft lilac chip with Ink text by default', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toHaveClass('bg-lilac', 'text-ink', 'border-transparent');
  });

  it.each(['mint', 'peach', 'rose', 'sky', 'butter', 'paper'] as const)(
    'fills the %s tone',
    (tone) => {
      render(<Badge tone={tone}>Label</Badge>);
      expect(screen.getByText('Label')).toHaveClass(`bg-${tone}`);
    },
  );

  it('draws an Ink outline as a sticker', () => {
    render(<Badge variant="sticker">EN</Badge>);
    expect(screen.getByText('EN')).toHaveClass('border-ink');
  });

  it('never uses shadcn’s white-on-colour text', () => {
    render(<Badge tone="rose">Due</Badge>);
    expect(screen.getByText('Due')).not.toHaveClass('text-white', 'text-primary-foreground');
  });

  it('renders a link through asChild', () => {
    render(
      <Badge asChild tone="sky">
        <a href="#spanish">Spanish</a>
      </Badge>,
    );
    expect(screen.getByRole('link', { name: 'Spanish' })).toHaveClass('bg-sky');
  });
});

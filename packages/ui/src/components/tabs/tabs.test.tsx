import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsProps } from '.';

function Deck({ variant = 'pills' }: { variant?: TabsProps['variant'] }): React.JSX.Element {
  return (
    <Tabs defaultValue="cards" variant={variant}>
      <TabsList aria-label="Deck">
        <TabsTrigger value="cards">Cards</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent value="cards">42 cards</TabsContent>
      <TabsContent value="stats">91% retention</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('shows the panel of the active tab', async () => {
    const user = userEvent.setup();
    render(<Deck />);

    expect(screen.getByRole('tabpanel')).toHaveTextContent('42 cards');
    await user.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(screen.getByRole('tabpanel', { name: 'Stats' })).toHaveTextContent('91% retention');
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Deck />);

    screen.getByRole('tab', { name: 'Cards' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Stats' })).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the active tab with an Ink outline, not Lilac alone', () => {
    render(<Deck />);
    expect(screen.getByRole('tab', { name: 'Cards' })).toHaveClass(
      'data-[state=active]:border-ink',
      'data-[state=active]:bg-lilac',
    );
  });

  it('tells its parts to draw the underline variant', () => {
    const { container } = render(<Deck variant="underline" />);
    expect(container.firstChild).toHaveAttribute('data-variant', 'underline');
  });
});

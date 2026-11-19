import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '.';

function Site(): React.JSX.Element {
  return (
    <NavigationMenu aria-label="Main">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Study</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#today">Today</NavigationMenuLink>
            <NavigationMenuLink href="#stats">Stats</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#decks" active className={navigationMenuTriggerStyle()}>
            Decks
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

describe('NavigationMenu', () => {
  it('is a named navigation landmark', () => {
    render(<Site />);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('marks the current page', () => {
    render(<Site />);
    const decks = screen.getByRole('link', { name: 'Decks' });

    expect(decks).toHaveAttribute('aria-current', 'page');
    expect(decks).toHaveClass('data-[active=true]:bg-lilac/40', 'rounded-full');
  });

  it('opens a panel of links from its trigger', async () => {
    const user = userEvent.setup();
    render(<Site />);
    const trigger = screen.getByRole('button', { name: 'Study' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: 'Today' })).toBeInTheDocument();
  });

  it('draws triggers as pills with the Butter highlight', () => {
    render(<Site />);
    expect(screen.getByRole('button', { name: 'Study' })).toHaveClass(
      'rounded-full',
      'hover:bg-butter',
      'focus-visible:outline-focus',
    );
  });
});

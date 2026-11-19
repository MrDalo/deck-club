import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '.';

function App(): React.JSX.Element {
  return (
    <SidebarProvider>
      <Sidebar label="Menu" closeLabel="Close menu">
        <SidebarContent>
          <nav aria-label="Main">
            <SidebarGroup>
              <SidebarGroupLabel>Study</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <a href="#decks">Decks</a>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#clubs">Clubs</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarRail label="Collapse or expand the menu" />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger label="Show or hide the menu" />
      </SidebarInset>
    </SidebarProvider>
  );
}

const sidebarState = (): string | null | undefined =>
  document.querySelector('[data-slot="sidebar"]')?.getAttribute('data-state');

describe('Sidebar', () => {
  const desktopWidth = window.innerWidth;
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: desktopWidth });
  });

  it('marks the current page and names its trigger in the page’s language', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Decks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Clubs' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Show or hide the menu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Toggle Sidebar' })).not.toBeInTheDocument();
  });

  it('collapses and expands from its trigger', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(sidebarState()).toBe('expanded');
    await user.click(screen.getByRole('button', { name: 'Show or hide the menu' }));
    expect(sidebarState()).toBe('collapsed');
  });

  it('toggles with Ctrl+B', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('{Control>}b{/Control}');
    expect(sidebarState()).toBe('collapsed');
  });

  it('opens as a named panel with a translated close button on a phone', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Show or hide the menu' }));
    const panel = await screen.findByRole('dialog', { name: 'Menu' });

    expect(panel).toHaveAttribute('data-mobile', 'true');
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Decks' })).toBeInTheDocument();
  });
});

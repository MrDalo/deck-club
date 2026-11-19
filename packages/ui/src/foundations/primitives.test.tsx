import { composeStories } from '@storybook/react-vite';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import * as stories from './primitives.stories';

const {
  Actions,
  Forms,
  Display,
  Navigation,
  Overlays,
  Composites,
  FormsAndLists,
  LayoutAndFeedback,
} = composeStories(stories);

/**
 * The vendored shadcn/ui layer is never edited, but it is upgraded
 * (`pnpm ui:add --overwrite`). These tests render every primitive and drive
 * the interactive ones, so an upgrade that breaks one fails here.
 */
describe('shadcn/ui primitives', () => {
  it.each([
    ['Actions', Actions],
    ['Forms', Forms],
    ['Display', Display],
    ['Navigation', Navigation],
    ['Overlays', Overlays],
    ['Composites', Composites],
    ['FormsAndLists', FormsAndLists],
    ['LayoutAndFeedback', LayoutAndFeedback],
  ])('renders the %s catalogue', (_name, Story) => {
    const { container } = render(<Story />);
    expect(container.querySelector('[data-slot]')).toBeInTheDocument();
  });

  it('toggles the form controls', async () => {
    const user = userEvent.setup();
    render(<Forms />);

    const shuffle = screen.getByRole('checkbox', { name: 'Shuffle cards' });
    await user.click(shuffle);
    expect(shuffle).toHaveAttribute('data-state', 'unchecked');

    const reminders = screen.getByRole('switch', { name: 'Daily reminders' });
    await user.click(reminders);
    expect(reminders).toHaveAttribute('aria-checked', 'false');

    await user.click(screen.getByRole('radio', { name: 'easy' }));
    expect(screen.getByRole('radio', { name: 'easy' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'good' })).not.toBeChecked();

    const slider = screen.getByRole('slider');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '21');
  });

  it('picks a value from the select', async () => {
    const user = userEvent.setup();
    render(<Forms />);

    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    await user.click(await screen.findByRole('option', { name: 'Čeština' }));

    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveTextContent('Čeština');
  });

  it('switches tabs and opens the accordion', async () => {
    const user = userEvent.setup();
    render(<Display />);

    await user.click(screen.getByRole('tab', { name: 'Stats' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Retention 91%.');

    await user.click(screen.getByRole('button', { name: 'Can my AI add cards?' }));
    expect(screen.getByText('Yes, through the Deck Club MCP server.')).toBeVisible();
  });

  it('opens and closes the dialog', async () => {
    const user = userEvent.setup();
    render(<Overlays />);

    await user.click(screen.getByRole('button', { name: 'Dialog' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename deck' });
    expect(within(dialog).getByRole('textbox', { name: 'Deck name' })).toHaveValue('Biology exam');

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before a destructive action', async () => {
    const user = userEvent.setup();
    render(<Overlays />);

    await user.click(screen.getByRole('button', { name: 'Alert dialog' }));
    const alert = await screen.findByRole('alertdialog', { name: 'Delete this deck?' });
    await user.click(within(alert).getByRole('button', { name: 'Keep deck' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('opens the sheet and the popover', async () => {
    const user = userEvent.setup();
    render(<Overlays />);

    await user.click(screen.getByRole('button', { name: 'Sheet' }));
    expect(await screen.findByRole('dialog', { name: 'Deck settings' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Popover' }));
    expect(await screen.findByText('Next review in 3 days.')).toBeInTheDocument();
  });

  it('shows the tooltip on keyboard focus', async () => {
    const user = userEvent.setup();
    render(<Overlays />);

    await user.tab();
    while (document.activeElement?.textContent !== 'Tooltip') await user.tab();

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Shortcut: Space');
  });

  it('opens the dropdown and the context menu', async () => {
    const user = userEvent.setup();
    render(<Overlays />);

    await user.click(screen.getByRole('button', { name: 'Dropdown menu' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitemcheckbox', { name: 'Show due cards' })).toBeChecked();
    expect(within(menu).getByRole('menuitem', { name: 'Delete' })).toHaveAttribute(
      'data-variant',
      'destructive',
    );
    await user.keyboard('{Escape}');

    fireEvent.contextMenu(screen.getByText('Right-click here'));
    expect(await screen.findByRole('menuitem', { name: 'Edit card' })).toBeInTheDocument();
  });

  it('names the resize handle and raises a toast', async () => {
    const user = userEvent.setup();
    render(<LayoutAndFeedback />);

    // Keyboard resizing needs real layout; the browser checks it (Storybook).
    expect(screen.getByRole('separator', { name: 'Resize the card sides' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toast' }));
    expect(await screen.findByText('Deck saved')).toBeInTheDocument();
  });
});

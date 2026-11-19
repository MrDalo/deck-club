import type { ComponentProps } from 'react';
import { FOCUS_RING, MENU_ITEM, MENU_ITEM_DANGER, SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  MenubarCheckboxItem as MenubarCheckboxItemPrimitive,
  MenubarContent as MenubarContentPrimitive,
  MenubarItem as MenubarItemPrimitive,
  MenubarLabel as MenubarLabelPrimitive,
  Menubar as MenubarPrimitive,
  MenubarRadioItem as MenubarRadioItemPrimitive,
  MenubarSeparator as MenubarSeparatorPrimitive,
  MenubarShortcut as MenubarShortcutPrimitive,
  MenubarSubContent as MenubarSubContentPrimitive,
  MenubarSubTrigger as MenubarSubTriggerPrimitive,
  MenubarTrigger as MenubarTriggerPrimitive,
} from '#ui/menubar';

export {
  MenubarGroup,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarSub,
} from '#ui/menubar';

/**
 * A row of menus, as in a desktop app: the card editor's Deck, Card and View
 * menus. Arrow keys move between menus. Name it with `aria-label`.
 */
export function Menubar({
  className,
  ...props
}: ComponentProps<typeof MenubarPrimitive>): React.JSX.Element {
  return (
    <MenubarPrimitive
      className={cn(
        'h-12 w-fit gap-1 rounded-full border-2 border-ink bg-card p-1.5 shadow-sticker-sm',
        className,
      )}
      {...props}
    />
  );
}

export function MenubarTrigger({
  className,
  ...props
}: ComponentProps<typeof MenubarTriggerPrimitive>): React.JSX.Element {
  return (
    <MenubarTriggerPrimitive
      className={cn(
        'rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink focus:bg-butter focus:text-ink data-[state=open]:bg-butter data-[state=open]:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function MenubarContent({
  className,
  ...props
}: ComponentProps<typeof MenubarContentPrimitive>): React.JSX.Element {
  return (
    <MenubarContentPrimitive className={cn(SURFACE, 'min-w-52 p-1.5', className)} {...props} />
  );
}

export function MenubarSubContent({
  className,
  ...props
}: ComponentProps<typeof MenubarSubContentPrimitive>): React.JSX.Element {
  return (
    <MenubarSubContentPrimitive className={cn(SURFACE, 'min-w-44 p-1.5', className)} {...props} />
  );
}

export function MenubarItem({
  className,
  ...props
}: ComponentProps<typeof MenubarItemPrimitive>): React.JSX.Element {
  return (
    <MenubarItemPrimitive
      className={cn(MENU_ITEM, MENU_ITEM_DANGER, '[&_svg:not([class*=text-])]:text-ink', className)}
      {...props}
    />
  );
}

export function MenubarSubTrigger({
  className,
  ...props
}: ComponentProps<typeof MenubarSubTriggerPrimitive>): React.JSX.Element {
  return (
    <MenubarSubTriggerPrimitive
      className={cn(MENU_ITEM, 'data-[state=open]:bg-butter data-[state=open]:text-ink', className)}
      {...props}
    />
  );
}

export function MenubarCheckboxItem({
  className,
  ...props
}: ComponentProps<typeof MenubarCheckboxItemPrimitive>): React.JSX.Element {
  return (
    <MenubarCheckboxItemPrimitive
      className={cn(MENU_ITEM, 'pl-8 [&_svg]:stroke-[3] [&_svg]:text-ink', className)}
      {...props}
    />
  );
}

export function MenubarRadioItem({
  className,
  ...props
}: ComponentProps<typeof MenubarRadioItemPrimitive>): React.JSX.Element {
  return (
    <MenubarRadioItemPrimitive
      className={cn(MENU_ITEM, 'pl-8 [&_svg]:size-2.5 [&_svg]:text-ink', className)}
      {...props}
    />
  );
}

export function MenubarLabel({
  className,
  ...props
}: ComponentProps<typeof MenubarLabelPrimitive>): React.JSX.Element {
  return (
    <MenubarLabelPrimitive
      className={cn(
        'px-2.5 pt-2 pb-1 text-xs font-bold tracking-wide text-ink-soft uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function MenubarSeparator({
  className,
  ...props
}: ComponentProps<typeof MenubarSeparatorPrimitive>): React.JSX.Element {
  return (
    <MenubarSeparatorPrimitive className={cn('mx-0 my-1.5 h-0.5 bg-line', className)} {...props} />
  );
}

export function MenubarShortcut({
  className,
  ...props
}: ComponentProps<typeof MenubarShortcutPrimitive>): React.JSX.Element {
  return (
    <MenubarShortcutPrimitive
      className={cn('pl-4 font-semibold tracking-normal text-ink-soft', className)}
      {...props}
    />
  );
}

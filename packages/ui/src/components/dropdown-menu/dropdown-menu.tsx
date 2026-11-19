import type { ComponentProps } from 'react';
import { MENU_ITEM, MENU_ITEM_DANGER, SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  DropdownMenuCheckboxItem as DropdownMenuCheckboxItemPrimitive,
  DropdownMenuContent as DropdownMenuContentPrimitive,
  DropdownMenuItem as DropdownMenuItemPrimitive,
  DropdownMenuLabel as DropdownMenuLabelPrimitive,
  DropdownMenuRadioItem as DropdownMenuRadioItemPrimitive,
  DropdownMenuSeparator as DropdownMenuSeparatorPrimitive,
  DropdownMenuShortcut as DropdownMenuShortcutPrimitive,
  DropdownMenuSubContent as DropdownMenuSubContentPrimitive,
  DropdownMenuSubTrigger as DropdownMenuSubTriggerPrimitive,
} from '#ui/dropdown-menu';

export {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuTrigger,
} from '#ui/dropdown-menu';

/** The menu: a sticker card. Arrow keys move, typing jumps, Escape closes. */
export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuContentPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuContentPrimitive className={cn(SURFACE, 'min-w-48 p-1.5', className)} {...props} />
  );
}

export function DropdownMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuSubContentPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuSubContentPrimitive
      className={cn(SURFACE, 'min-w-44 p-1.5', className)}
      {...props}
    />
  );
}

/** A row. `variant="destructive"` for Delete: Danger text, a rose wash. */
export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuItemPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuItemPrimitive
      className={cn(MENU_ITEM, MENU_ITEM_DANGER, '[&_svg:not([class*=text-])]:text-ink', className)}
      {...props}
    />
  );
}

export function DropdownMenuSubTrigger({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuSubTriggerPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuSubTriggerPrimitive
      className={cn(
        MENU_ITEM,
        'data-[state=open]:bg-butter data-[state=open]:text-ink [&_svg:not([class*=text-])]:text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuCheckboxItemPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuCheckboxItemPrimitive
      className={cn(MENU_ITEM, 'pl-8 [&_svg]:stroke-[3] [&_svg]:text-ink', className)}
      {...props}
    />
  );
}

export function DropdownMenuRadioItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuRadioItemPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuRadioItemPrimitive
      className={cn(MENU_ITEM, 'pl-8 [&_svg]:size-2.5 [&_svg]:text-ink', className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuLabelPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuLabelPrimitive
      className={cn(
        'px-2.5 pt-2 pb-1 text-xs font-bold tracking-wide text-ink-soft uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuSeparatorPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuSeparatorPrimitive
      className={cn('mx-0 my-1.5 h-0.5 bg-line', className)}
      {...props}
    />
  );
}

export function DropdownMenuShortcut({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuShortcutPrimitive>): React.JSX.Element {
  return (
    <DropdownMenuShortcutPrimitive
      className={cn('pl-4 font-semibold tracking-normal text-ink-soft', className)}
      {...props}
    />
  );
}

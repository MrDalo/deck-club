import type { ComponentProps } from 'react';
import { MENU_ITEM, MENU_ITEM_DANGER, SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  ContextMenuCheckboxItem as ContextMenuCheckboxItemPrimitive,
  ContextMenuContent as ContextMenuContentPrimitive,
  ContextMenuItem as ContextMenuItemPrimitive,
  ContextMenuLabel as ContextMenuLabelPrimitive,
  ContextMenuRadioItem as ContextMenuRadioItemPrimitive,
  ContextMenuSeparator as ContextMenuSeparatorPrimitive,
  ContextMenuShortcut as ContextMenuShortcutPrimitive,
  ContextMenuSubContent as ContextMenuSubContentPrimitive,
  ContextMenuSubTrigger as ContextMenuSubTriggerPrimitive,
  ContextMenuTrigger as ContextMenuTriggerPrimitive,
} from '#ui/context-menu';

export {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuSub,
} from '#ui/context-menu';

/** The area that opens the menu on right-click or long-press. */
export function ContextMenuTrigger({
  className,
  ...props
}: ComponentProps<typeof ContextMenuTriggerPrimitive>): React.JSX.Element {
  return <ContextMenuTriggerPrimitive className={cn('select-none', className)} {...props} />;
}

export function ContextMenuContent({
  className,
  ...props
}: ComponentProps<typeof ContextMenuContentPrimitive>): React.JSX.Element {
  return (
    <ContextMenuContentPrimitive className={cn(SURFACE, 'min-w-48 p-1.5', className)} {...props} />
  );
}

export function ContextMenuSubContent({
  className,
  ...props
}: ComponentProps<typeof ContextMenuSubContentPrimitive>): React.JSX.Element {
  return (
    <ContextMenuSubContentPrimitive
      className={cn(SURFACE, 'min-w-44 p-1.5', className)}
      {...props}
    />
  );
}

/** A row. `variant="destructive"` for Delete: Danger text, a rose wash. */
export function ContextMenuItem({
  className,
  ...props
}: ComponentProps<typeof ContextMenuItemPrimitive>): React.JSX.Element {
  return (
    <ContextMenuItemPrimitive
      className={cn(MENU_ITEM, MENU_ITEM_DANGER, '[&_svg:not([class*=text-])]:text-ink', className)}
      {...props}
    />
  );
}

export function ContextMenuSubTrigger({
  className,
  ...props
}: ComponentProps<typeof ContextMenuSubTriggerPrimitive>): React.JSX.Element {
  return (
    <ContextMenuSubTriggerPrimitive
      className={cn(
        MENU_ITEM,
        'data-[state=open]:bg-butter data-[state=open]:text-ink [&_svg:not([class*=text-])]:text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function ContextMenuCheckboxItem({
  className,
  ...props
}: ComponentProps<typeof ContextMenuCheckboxItemPrimitive>): React.JSX.Element {
  return (
    <ContextMenuCheckboxItemPrimitive
      className={cn(MENU_ITEM, 'pl-8 [&_svg]:stroke-[3] [&_svg]:text-ink', className)}
      {...props}
    />
  );
}

export function ContextMenuRadioItem({
  className,
  ...props
}: ComponentProps<typeof ContextMenuRadioItemPrimitive>): React.JSX.Element {
  return (
    <ContextMenuRadioItemPrimitive
      className={cn(MENU_ITEM, 'pl-8 [&_svg]:size-2.5 [&_svg]:text-ink', className)}
      {...props}
    />
  );
}

export function ContextMenuLabel({
  className,
  ...props
}: ComponentProps<typeof ContextMenuLabelPrimitive>): React.JSX.Element {
  return (
    <ContextMenuLabelPrimitive
      className={cn(
        'px-2.5 pt-2 pb-1 text-xs font-bold tracking-wide text-ink-soft uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function ContextMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof ContextMenuSeparatorPrimitive>): React.JSX.Element {
  return (
    <ContextMenuSeparatorPrimitive
      className={cn('mx-0 my-1.5 h-0.5 bg-line', className)}
      {...props}
    />
  );
}

export function ContextMenuShortcut({
  className,
  ...props
}: ComponentProps<typeof ContextMenuShortcutPrimitive>): React.JSX.Element {
  return (
    <ContextMenuShortcutPrimitive
      className={cn('pl-4 font-semibold tracking-normal text-ink-soft', className)}
      {...props}
    />
  );
}

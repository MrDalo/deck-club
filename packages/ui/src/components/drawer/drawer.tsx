import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  DrawerContent as DrawerContentPrimitive,
  DrawerDescription as DrawerDescriptionPrimitive,
  DrawerFooter as DrawerFooterPrimitive,
  DrawerHeader as DrawerHeaderPrimitive,
  DrawerTitle as DrawerTitlePrimitive,
} from '#ui/drawer';

export { Drawer, DrawerClose, DrawerTrigger } from '#ui/drawer';

/**
 * A panel that slides in from an edge (`direction` on Drawer; bottom by
 * default, with a drag handle). On phones, the place for card actions and
 * filters. Escape, the overlay or a drag closes it.
 */
export function DrawerContent({
  className,
  ...props
}: ComponentProps<typeof DrawerContentPrimitive>): React.JSX.Element {
  return (
    <DrawerContentPrimitive
      className={cn(
        'border-ink bg-card text-ink',
        'data-[vaul-drawer-direction=bottom]:rounded-t-card data-[vaul-drawer-direction=bottom]:border-x-2 data-[vaul-drawer-direction=bottom]:border-t-2',
        'data-[vaul-drawer-direction=top]:rounded-b-card data-[vaul-drawer-direction=top]:border-x-2 data-[vaul-drawer-direction=top]:border-b-2',
        'data-[vaul-drawer-direction=left]:rounded-r-card data-[vaul-drawer-direction=left]:border-y-2 data-[vaul-drawer-direction=left]:border-r-2',
        'data-[vaul-drawer-direction=right]:rounded-l-card data-[vaul-drawer-direction=right]:border-y-2 data-[vaul-drawer-direction=right]:border-l-2',
        // The drag handle.
        '[&>div:first-child]:h-1.5 [&>div:first-child]:bg-ink/30',
        className,
      )}
      {...props}
    />
  );
}

export function DrawerHeader({
  className,
  ...props
}: ComponentProps<typeof DrawerHeaderPrimitive>): React.JSX.Element {
  return <DrawerHeaderPrimitive className={cn('gap-1.5 px-5', className)} {...props} />;
}

export function DrawerFooter({
  className,
  ...props
}: ComponentProps<typeof DrawerFooterPrimitive>): React.JSX.Element {
  return <DrawerFooterPrimitive className={cn('gap-3 px-5 pb-6', className)} {...props} />;
}

export function DrawerTitle({
  className,
  ...props
}: ComponentProps<typeof DrawerTitlePrimitive>): React.JSX.Element {
  return (
    <DrawerTitlePrimitive
      className={cn('font-display text-xl font-bold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof DrawerDescriptionPrimitive>): React.JSX.Element {
  return (
    <DrawerDescriptionPrimitive className={cn('text-base text-ink-soft', className)} {...props} />
  );
}

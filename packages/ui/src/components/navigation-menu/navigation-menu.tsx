import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  NavigationMenuContent as NavigationMenuContentPrimitive,
  NavigationMenuLink as NavigationMenuLinkPrimitive,
  NavigationMenuList as NavigationMenuListPrimitive,
  NavigationMenu as NavigationMenuPrimitive,
  NavigationMenuTrigger as NavigationMenuTriggerPrimitive,
} from '#ui/navigation-menu';

export { NavigationMenuIndicator, NavigationMenuItem } from '#ui/navigation-menu';

/** A pill in the site navigation; use it on plain links next to menu triggers. */
export const navigationMenuTriggerStyle = cva([
  'inline-flex h-10 w-max items-center justify-center rounded-full bg-transparent px-4 text-sm font-semibold text-ink',
  'hover:bg-butter hover:text-ink focus:bg-butter focus:text-ink data-[state=open]:bg-butter data-[state=open]:text-ink data-[state=open]:hover:bg-butter data-[state=open]:focus:bg-butter',
  'disabled:pointer-events-none disabled:opacity-50',
  FOCUS_RING,
]);

/**
 * The site's main navigation: links, and triggers that open a panel of
 * links. Panels open in one shared sticker viewport under the bar. Name it
 * with `aria-label` when a page has more than one navigation.
 */
export function NavigationMenu({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive>): React.JSX.Element {
  return (
    <NavigationMenuPrimitive
      className={cn(
        '[&_[data-slot=navigation-menu-viewport]]:rounded-2xl [&_[data-slot=navigation-menu-viewport]]:border-2 [&_[data-slot=navigation-menu-viewport]]:border-ink [&_[data-slot=navigation-menu-viewport]]:bg-card [&_[data-slot=navigation-menu-viewport]]:text-ink [&_[data-slot=navigation-menu-viewport]]:shadow-sticker',
        className,
      )}
      {...props}
    />
  );
}

export function NavigationMenuList({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuListPrimitive>): React.JSX.Element {
  return <NavigationMenuListPrimitive className={cn('gap-1', className)} {...props} />;
}

export function NavigationMenuTrigger({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuTriggerPrimitive>): React.JSX.Element {
  return (
    <NavigationMenuTriggerPrimitive
      className={cn(navigationMenuTriggerStyle(), '[&>svg]:size-3.5', className)}
      {...props}
    />
  );
}

export function NavigationMenuContent({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuContentPrimitive>): React.JSX.Element {
  return (
    <NavigationMenuContentPrimitive
      className={cn(
        'p-2.5 group-data-[viewport=false]/navigation-menu:rounded-2xl group-data-[viewport=false]/navigation-menu:border-2 group-data-[viewport=false]/navigation-menu:border-ink group-data-[viewport=false]/navigation-menu:bg-card group-data-[viewport=false]/navigation-menu:shadow-sticker',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A link in the navigation or in a panel. Mark the current page with
 * `active`: it reads as the page you are on (`aria-current="page"`).
 */
export function NavigationMenuLink({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuLinkPrimitive>): React.JSX.Element {
  return (
    <NavigationMenuLinkPrimitive
      className={cn(
        'rounded-xl p-2.5 text-sm text-ink hover:bg-butter hover:text-ink focus:bg-butter focus:text-ink',
        'data-[active=true]:bg-lilac/40 data-[active=true]:font-semibold data-[active=true]:ring-2 data-[active=true]:ring-ink data-[active=true]:ring-inset data-[active=true]:hover:bg-lilac/60 data-[active=true]:focus:bg-lilac/60',
        '[&_svg:not([class*=text-])]:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

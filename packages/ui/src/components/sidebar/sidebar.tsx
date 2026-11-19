'use client';

import type { ComponentProps, CSSProperties } from 'react';
import { buttonVariants } from '#components/button';
import { Sheet, SheetContent, SheetTitle } from '#components/sheet';
import { Skeleton } from '#components/skeleton';
import { FIELD, FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  SidebarGroupAction as SidebarGroupActionPrimitive,
  SidebarGroupLabel as SidebarGroupLabelPrimitive,
  SidebarInput as SidebarInputPrimitive,
  SidebarInset as SidebarInsetPrimitive,
  SidebarMenuAction as SidebarMenuActionPrimitive,
  SidebarMenuBadge as SidebarMenuBadgePrimitive,
  SidebarMenuButton as SidebarMenuButtonPrimitive,
  SidebarMenuSub as SidebarMenuSubPrimitive,
  SidebarMenuSubButton as SidebarMenuSubButtonPrimitive,
  Sidebar as SidebarPrimitive,
  SidebarRail as SidebarRailPrimitive,
  SidebarSeparator as SidebarSeparatorPrimitive,
  SidebarTrigger as SidebarTriggerPrimitive,
  useSidebar,
} from '#ui/sidebar';

export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarProvider,
  useSidebar,
} from '#ui/sidebar';

export type SidebarProps = ComponentProps<typeof SidebarPrimitive> & {
  /** Names the sidebar when it opens as a panel on a phone, translated ("Menu"). */
  label: string;
  /** Names that panel's close button, translated ("Close menu"). */
  closeLabel: string;
};

/**
 * The app's side navigation: decks, clubs, stats. Collapses to icons or
 * slides away on desktop (⌘B / Ctrl+B toggles it) and opens as a panel on
 * phones. Wrap the page in SidebarProvider; put a `<nav>` inside.
 */
export function Sidebar({
  label,
  closeLabel,
  side = 'left',
  collapsible = 'offcanvas',
  className,
  children,
  ...props
}: SidebarProps): React.JSX.Element {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  // shadcn's phone panel is named "Sidebar" in English; this one is named by `label`.
  if (isMobile && collapsible !== 'none')
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          closeLabel={closeLabel}
          aria-describedby={undefined}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-72 max-w-[85vw] bg-sidebar p-0 text-ink"
        >
          <SheetTitle className="sr-only">{label}</SheetTitle>
          <div className="flex h-full w-full flex-col pt-12">{children}</div>
        </SheetContent>
      </Sheet>
    );
  return (
    <SidebarPrimitive
      side={side}
      collapsible={collapsible}
      className={cn(
        'border-ink text-ink group-data-[side=left]:border-r-2 group-data-[side=right]:border-l-2',
        '[&>[data-slot=sidebar-inner]]:bg-sidebar',
        'group-data-[variant=floating]:[&>[data-slot=sidebar-inner]]:rounded-card group-data-[variant=floating]:[&>[data-slot=sidebar-inner]]:border-2 group-data-[variant=floating]:[&>[data-slot=sidebar-inner]]:border-ink group-data-[variant=floating]:[&>[data-slot=sidebar-inner]]:shadow-sticker-sm',
        className,
      )}
      {...props}
    >
      {children}
    </SidebarPrimitive>
  );
}

type SidebarTriggerProps = Omit<ComponentProps<typeof SidebarTriggerPrimitive>, 'aria-label'> & {
  /** Names the button, translated ("Show or hide the menu"). */
  label: string;
};

export function SidebarTrigger({
  label,
  className,
  ...props
}: SidebarTriggerProps): React.JSX.Element {
  return (
    <SidebarTriggerPrimitive
      aria-label={label}
      className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), className)}
      {...props}
    />
  );
}

type SidebarRailProps = ComponentProps<typeof SidebarRailPrimitive> & { label: string };

/** The thin strip along the sidebar's edge that toggles it with the pointer. */
export function SidebarRail({ label, className, ...props }: SidebarRailProps): React.JSX.Element {
  return (
    <SidebarRailPrimitive
      aria-label={label}
      title={label}
      className={cn('hover:after:bg-ink/40', className)}
      {...props}
    />
  );
}

/** The page beside the sidebar. With `variant="inset"` on the sidebar it becomes a sticker card. */
export function SidebarInset({
  className,
  ...props
}: ComponentProps<typeof SidebarInsetPrimitive>): React.JSX.Element {
  return (
    <SidebarInsetPrimitive
      className={cn(
        'bg-paper text-ink md:peer-data-[variant=inset]:rounded-card md:peer-data-[variant=inset]:border-2 md:peer-data-[variant=inset]:border-ink md:peer-data-[variant=inset]:bg-card md:peer-data-[variant=inset]:shadow-sticker-sm',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarInput({
  className,
  ...props
}: ComponentProps<typeof SidebarInputPrimitive>): React.JSX.Element {
  return (
    <SidebarInputPrimitive
      className={cn(
        FIELD,
        // Collapsed to icons there is no room to type: the field steps aside.
        'h-9 text-sm placeholder:text-ink-soft group-data-[collapsible=icon]:hidden',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function SidebarSeparator({
  className,
  ...props
}: ComponentProps<typeof SidebarSeparatorPrimitive>): React.JSX.Element {
  return (
    <SidebarSeparatorPrimitive
      // The primitive's own `w-auto` loses to the Separator's orientation
      // width, which overflows the collapsed sidebar: set both per orientation.
      className={cn(
        'mx-3 bg-line data-[orientation=horizontal]:h-0.5 data-[orientation=horizontal]:w-auto',
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupLabel({
  className,
  ...props
}: ComponentProps<typeof SidebarGroupLabelPrimitive>): React.JSX.Element {
  return (
    <SidebarGroupLabelPrimitive
      className={cn(
        'text-xs font-bold tracking-wide text-ink-soft uppercase',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

/** A small button beside a group's label ("Add a deck"). Name it with `aria-label`. */
export function SidebarGroupAction({
  className,
  ...props
}: ComponentProps<typeof SidebarGroupActionPrimitive>): React.JSX.Element {
  return (
    <SidebarGroupActionPrimitive
      className={cn('rounded-full text-ink hover:bg-butter hover:text-ink', FOCUS_RING, className)}
      {...props}
    />
  );
}

/**
 * A destination. The current page (`isActive`) reads as the current page and
 * shows it three ways: a Lilac wash, bold text and an Ink ring.
 */
export function SidebarMenuButton({
  isActive = false,
  className,
  ...props
}: ComponentProps<typeof SidebarMenuButtonPrimitive>): React.JSX.Element {
  return (
    <SidebarMenuButtonPrimitive
      isActive={isActive}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'h-10 rounded-xl px-3 text-sm font-semibold text-ink hover:bg-butter hover:text-ink active:bg-butter active:text-ink data-[size=lg]:h-14 [&>svg]:size-5',
        'data-[active=true]:bg-lilac/50 data-[active=true]:font-bold data-[active=true]:text-ink data-[active=true]:ring-2 data-[active=true]:ring-ink data-[active=true]:ring-inset',
        'data-[state=open]:hover:bg-butter data-[state=open]:hover:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

/** A button at the end of a menu row ("More"). Name it with `aria-label`. */
export function SidebarMenuAction({
  className,
  ...props
}: ComponentProps<typeof SidebarMenuActionPrimitive>): React.JSX.Element {
  return (
    <SidebarMenuActionPrimitive
      className={cn(
        // 28px, not shadcn's 20px: a target of at least 24px (WCAG 2.5.8), centred in the 40px row.
        'w-7 rounded-full text-ink hover:bg-butter hover:text-ink peer-data-[size=sm]/menu-button:top-1.5 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-3.5',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

/** A count at the end of a row: cards due. */
export function SidebarMenuBadge({
  className,
  ...props
}: ComponentProps<typeof SidebarMenuBadgePrimitive>): React.JSX.Element {
  return (
    <SidebarMenuBadgePrimitive
      className={cn(
        // Centred in the 40px row (56px for size="lg"); the primitive's tops fit 32px rows.
        'rounded-full bg-butter px-1.5 font-bold text-ink peer-data-[active=true]/menu-button:text-ink peer-data-[size=sm]/menu-button:top-2.5 peer-data-[size=default]/menu-button:top-2.5 peer-data-[size=lg]/menu-button:top-4.5',
        className,
      )}
      {...props}
    />
  );
}

type SidebarMenuSkeletonProps = ComponentProps<'div'> & {
  showIcon?: boolean;
  /** The text bar's width. Fixed, unlike shadcn's random one, so server and browser agree. */
  width?: CSSProperties['width'];
};

/** A menu row while the menu loads. */
export function SidebarMenuSkeleton({
  showIcon = false,
  width = '70%',
  className,
  ...props
}: SidebarMenuSkeletonProps): React.JSX.Element {
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn('flex h-10 items-center gap-2 rounded-xl px-3', className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-5 rounded-md" />}
      <Skeleton className="h-4" style={{ width }} />
    </div>
  );
}

export function SidebarMenuSub({
  className,
  ...props
}: ComponentProps<typeof SidebarMenuSubPrimitive>): React.JSX.Element {
  return <SidebarMenuSubPrimitive className={cn('border-l-2 border-line', className)} {...props} />;
}

export function SidebarMenuSubButton({
  isActive = false,
  className,
  ...props
}: ComponentProps<typeof SidebarMenuSubButtonPrimitive>): React.JSX.Element {
  return (
    <SidebarMenuSubButtonPrimitive
      isActive={isActive}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'h-8 rounded-lg font-semibold text-ink hover:bg-butter hover:text-ink active:bg-butter',
        'data-[active=true]:bg-lilac/50 data-[active=true]:font-bold data-[active=true]:text-ink',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

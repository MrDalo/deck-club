import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  TabsContent as TabsContentPrimitive,
  TabsList as TabsListPrimitive,
  Tabs as TabsPrimitive,
  TabsTrigger as TabsTriggerPrimitive,
} from '#ui/tabs';

export type TabsProps = ComponentProps<typeof TabsPrimitive> & {
  /** `pills`: tabs in a sticker track. `underline`: an Ink rule under the active tab. */
  variant?: 'pills' | 'underline';
};

/** Views of the same thing: a deck's cards, stats and settings. Arrow keys move between tabs. */
export function Tabs({ variant = 'pills', className, ...props }: TabsProps): React.JSX.Element {
  return (
    <TabsPrimitive
      data-variant={variant}
      className={cn('group/tabs gap-3', className)}
      {...props}
    />
  );
}

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsListPrimitive>): React.JSX.Element {
  return (
    <TabsListPrimitive
      className={cn(
        'h-12 gap-1 rounded-full border-2 border-ink bg-card p-1 text-ink-soft',
        'group-data-[variant=underline]/tabs:h-auto group-data-[variant=underline]/tabs:gap-5 group-data-[variant=underline]/tabs:rounded-none group-data-[variant=underline]/tabs:border-0 group-data-[variant=underline]/tabs:border-b-2 group-data-[variant=underline]/tabs:border-line group-data-[variant=underline]/tabs:bg-transparent group-data-[variant=underline]/tabs:p-0',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A tab. The active one is Ink on Lilac inside an Ink outline (pills), or
 * Ink over a 3px Ink rule (underline): never the colour alone.
 */
export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsTriggerPrimitive>): React.JSX.Element {
  return (
    <TabsTriggerPrimitive
      className={cn(
        'h-full rounded-full border-2 border-transparent px-4 text-base font-semibold text-ink-soft hover:text-ink',
        'data-[state=active]:border-ink data-[state=active]:bg-lilac data-[state=active]:text-ink data-[state=active]:shadow-none',
        'group-data-[variant=underline]/tabs:-mb-0.5 group-data-[variant=underline]/tabs:flex-none group-data-[variant=underline]/tabs:rounded-none group-data-[variant=underline]/tabs:border-x-0 group-data-[variant=underline]/tabs:border-t-0 group-data-[variant=underline]/tabs:border-b-[3px] group-data-[variant=underline]/tabs:px-1 group-data-[variant=underline]/tabs:pb-2',
        'group-data-[variant=underline]/tabs:data-[state=active]:bg-transparent',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsContentPrimitive>): React.JSX.Element {
  return (
    <TabsContentPrimitive className={cn('rounded-xl text-ink', FOCUS_RING, className)} {...props} />
  );
}

'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { createContext, useContext, type ComponentProps } from 'react';
import { FOCUS_RING, PASTEL_FILL, type Pastel } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  ItemActions as ItemActionsPrimitive,
  ItemContent as ItemContentPrimitive,
  ItemDescription as ItemDescriptionPrimitive,
  ItemGroup as ItemGroupPrimitive,
  ItemMedia as ItemMediaPrimitive,
  Item as ItemPrimitive,
  ItemSeparator as ItemSeparatorPrimitive,
  ItemTitle as ItemTitlePrimitive,
} from '#ui/item';

export { ItemFooter, ItemHeader } from '#ui/item';

/** Whether an item sits in an ItemGroup, which is a list. */
const InGroupContext = createContext(false);

const itemVariants = cva(
  ['gap-3 rounded-2xl text-base text-ink', '[a]:hover:bg-butter/40', FOCUS_RING],
  {
    variants: {
      variant: {
        plain: 'border-transparent bg-transparent',
        outline: 'border-2 border-ink bg-card',
        sticker: 'border-2 border-ink bg-card shadow-sticker-sm',
        muted: 'border-transparent bg-line/50',
      },
      size: { md: 'p-4', sm: 'px-3.5 py-2.5' },
    },
    defaultVariants: { variant: 'plain', size: 'md' },
  },
);

export type ItemProps = Omit<ComponentProps<typeof ItemPrimitive>, 'variant' | 'size'> &
  VariantProps<typeof itemVariants>;

/**
 * One row of content: a deck, a member, a setting, a file. With `asChild` a
 * link becomes the whole row. Inside an ItemGroup it is a list item.
 */
export function Item({
  variant,
  size,
  asChild = false,
  className,
  ...props
}: ItemProps): React.JSX.Element {
  const inGroup = useContext(InGroupContext);
  const item = (
    <ItemPrimitive
      asChild={asChild}
      {...(inGroup && !asChild ? { role: 'listitem' } : {})}
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    />
  );
  // A link keeps its own role; a wrapper carries the list item role for it.
  return inGroup && asChild ? <div role="listitem">{item}</div> : item;
}

/** Items as a list: a deck list, club members, settings. */
export function ItemGroup({
  className,
  ...props
}: ComponentProps<typeof ItemGroupPrimitive>): React.JSX.Element {
  return (
    <InGroupContext.Provider value>
      <ItemGroupPrimitive className={cn('gap-2', className)} {...props} />
    </InGroupContext.Provider>
  );
}

export function ItemSeparator({
  className,
  ...props
}: ComponentProps<typeof ItemSeparatorPrimitive>): React.JSX.Element {
  return <ItemSeparatorPrimitive className={cn('h-0.5 bg-line', className)} {...props} />;
}

type ItemMediaProps = Omit<ComponentProps<typeof ItemMediaPrimitive>, 'variant'> & {
  /** `icon`: the icon on a pastel tile. `image`: a picture in an Ink frame. */
  variant?: 'icon' | 'image' | 'default';
  tone?: Pastel;
};

export function ItemMedia({
  variant = 'default',
  tone = 'lilac',
  className,
  ...props
}: ItemMediaProps): React.JSX.Element {
  return (
    <ItemMediaPrimitive
      variant={variant}
      className={cn(
        variant === 'icon' &&
          cn(
            'size-11 rounded-xl border-2 border-ink text-ink [&_svg:not([class*=size-])]:size-5',
            PASTEL_FILL[tone],
          ),
        variant === 'image' && 'size-12 rounded-xl border-2 border-ink',
        className,
      )}
      {...props}
    />
  );
}

export function ItemContent(props: ComponentProps<typeof ItemContentPrimitive>): React.JSX.Element {
  return <ItemContentPrimitive {...props} />;
}

export function ItemTitle({
  className,
  ...props
}: ComponentProps<typeof ItemTitlePrimitive>): React.JSX.Element {
  return (
    <ItemTitlePrimitive className={cn('text-base font-bold text-ink', className)} {...props} />
  );
}

export function ItemDescription({
  className,
  ...props
}: ComponentProps<typeof ItemDescriptionPrimitive>): React.JSX.Element {
  return (
    <ItemDescriptionPrimitive
      className={cn(
        'text-ink-soft [&>a]:font-semibold [&>a]:text-ink [&>a:hover]:text-ink [&>a:hover]:decoration-focus',
        className,
      )}
      {...props}
    />
  );
}

export function ItemActions(props: ComponentProps<typeof ItemActionsPrimitive>): React.JSX.Element {
  return <ItemActionsPrimitive {...props} />;
}

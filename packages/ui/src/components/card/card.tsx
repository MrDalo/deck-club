import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { PASTEL_FILL, type Pastel } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  CardAction as CardActionPrimitive,
  CardContent as CardContentPrimitive,
  CardDescription as CardDescriptionPrimitive,
  CardFooter as CardFooterPrimitive,
  CardHeader as CardHeaderPrimitive,
  Card as CardPrimitive,
  CardTitle as CardTitlePrimitive,
} from '#ui/card';

export const cardVariants = cva('gap-4 rounded-card border-2 border-ink bg-card py-5 text-ink', {
  variants: {
    variant: {
      sticker: 'shadow-sticker-sm',
      raised: 'shadow-sticker',
      flat: 'shadow-none',
      /** Index-card ruling with the rose margin rule. */
      ruled: 'ruled shadow-sticker-sm',
    },
    /** Lifts and tilts a little on hover, like a card picked off the desk. */
    interactive: {
      true: 'transition-transform duration-150 hover:-translate-y-0.5 hover:-rotate-[0.6deg] focus-within:-translate-y-0.5',
      false: '',
    },
  },
  defaultVariants: { variant: 'sticker', interactive: false },
});

export type CardProps = ComponentProps<typeof CardPrimitive> &
  VariantProps<typeof cardVariants> & {
    /** A pastel tab across the top, as deck tiles wear their deck's colour. */
    accent?: Pastel;
  };

/** A sticker card: 2px Ink outline, hard shadow, Card fill. */
export function Card({
  variant,
  interactive,
  accent,
  className,
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <CardPrimitive
      className={cn(
        cardVariants({ variant, interactive }),
        accent !== undefined && 'overflow-hidden pt-0',
        className,
      )}
      {...props}
    >
      {accent !== undefined && (
        <span
          aria-hidden
          data-slot="card-accent"
          className={cn('block h-3 shrink-0 border-b-2 border-ink', PASTEL_FILL[accent])}
        />
      )}
      {children}
    </CardPrimitive>
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentProps<typeof CardHeaderPrimitive>): React.JSX.Element {
  return <CardHeaderPrimitive className={cn('gap-1.5 px-5', className)} {...props} />;
}

type CardTitleProps = ComponentProps<typeof CardTitlePrimitive> & {
  /** The heading level it takes in the page outline. */
  level?: 2 | 3 | 4;
};

/** The card's title in the display face, announced as a heading. */
export function CardTitle({ level = 3, className, ...props }: CardTitleProps): React.JSX.Element {
  return (
    <CardTitlePrimitive
      role="heading"
      aria-level={level}
      className={cn('font-display text-lg leading-tight font-bold tracking-tight', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentProps<typeof CardDescriptionPrimitive>): React.JSX.Element {
  return <CardDescriptionPrimitive className={cn('text-ink-soft', className)} {...props} />;
}

export function CardAction(props: ComponentProps<typeof CardActionPrimitive>): React.JSX.Element {
  return <CardActionPrimitive {...props} />;
}

export function CardContent({
  className,
  ...props
}: ComponentProps<typeof CardContentPrimitive>): React.JSX.Element {
  return <CardContentPrimitive className={cn('px-5', className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: ComponentProps<typeof CardFooterPrimitive>): React.JSX.Element {
  return <CardFooterPrimitive className={cn('flex-wrap gap-2 px-5', className)} {...props} />;
}

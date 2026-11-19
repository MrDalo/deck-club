import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Badge as BadgePrimitive } from '#ui/badge';

/**
 * A chip. The tone says what it means (brand/README.md): mint for success
 * and AI, peach for caution, rose for danger, sky for the editor, butter for
 * highlights, lilac for the brand, paper for neutral facts.
 */
export const badgeVariants = cva(
  ['rounded-full px-2.5 py-0.5 text-xs font-bold text-ink [a&]:hover:brightness-95', FOCUS_RING],
  {
    variants: {
      tone: {
        lilac: 'bg-lilac',
        mint: 'bg-mint',
        peach: 'bg-peach',
        rose: 'bg-rose',
        sky: 'bg-sky',
        butter: 'bg-butter',
        paper: 'bg-paper',
      },
      variant: {
        soft: 'border-transparent',
        sticker: 'border-[1.5px] border-ink',
      },
    },
    // Paper on a Paper page would vanish: a soft paper chip keeps a Line outline.
    compoundVariants: [{ tone: 'paper', variant: 'soft', className: 'border-line' }],
    defaultVariants: { tone: 'lilac', variant: 'soft' },
  },
);

export type BadgeProps = Omit<ComponentProps<typeof BadgePrimitive>, 'variant'> &
  VariantProps<typeof badgeVariants>;

/** A small label: a count, a status, a language, "Added by Claude". */
export function Badge({ tone, variant, className, ...props }: BadgeProps): React.JSX.Element {
  return <BadgePrimitive className={cn(badgeVariants({ tone, variant }), className)} {...props} />;
}

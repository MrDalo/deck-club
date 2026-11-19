import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { AspectRatio as AspectRatioPrimitive } from '#ui/aspect-ratio';

const frameVariants = cva(
  'overflow-hidden [&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover',
  {
    variants: {
      frame: {
        /** An Ink-outlined card, as pictures sit on a card. */
        sticker: 'rounded-card border-2 border-ink bg-paper shadow-sticker-sm',
        /** Ruled index-card paper: a placeholder before the picture loads. */
        ruled: 'ruled rounded-card border-2 border-ink shadow-sticker-sm',
        none: 'rounded-none',
      },
    },
    defaultVariants: { frame: 'sticker' },
  },
);

export type AspectRatioProps = ComponentProps<typeof AspectRatioPrimitive> &
  VariantProps<typeof frameVariants>;

/** Keeps media at a fixed ratio (`ratio={16 / 9}`) inside a brand frame. */
export function AspectRatio({ frame, className, ...props }: AspectRatioProps): React.JSX.Element {
  return <AspectRatioPrimitive className={cn(frameVariants({ frame }), className)} {...props} />;
}

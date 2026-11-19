import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { Separator as SeparatorPrimitive } from '#ui/separator';

const separatorVariants = cva(
  'data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5',
  {
    variants: {
      variant: {
        /** A quiet rule between sections. */
        line: 'bg-line',
        /** A firm rule, in Ink. */
        ink: 'bg-ink',
        /** A dashed cut line, as on a sheet of index cards. */
        dashed:
          'border-dashed border-ink/40 bg-transparent data-[orientation=horizontal]:h-0 data-[orientation=horizontal]:border-t-2 data-[orientation=vertical]:w-0 data-[orientation=vertical]:border-l-2',
      },
    },
    defaultVariants: { variant: 'line' },
  },
);

export type SeparatorProps = ComponentProps<typeof SeparatorPrimitive> &
  VariantProps<typeof separatorVariants>;

/**
 * A rule between content. Decorative by default (hidden from assistive
 * technology); pass `decorative={false}` when it separates real sections.
 */
export function Separator({ variant, className, ...props }: SeparatorProps): React.JSX.Element {
  return (
    <SeparatorPrimitive className={cn(separatorVariants({ variant }), className)} {...props} />
  );
}

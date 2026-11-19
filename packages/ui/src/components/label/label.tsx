import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { Label as LabelPrimitive } from '#ui/label';

export type LabelProps = ComponentProps<typeof LabelPrimitive>;

/** Names a form control: Ink, semibold. Clicking it focuses the control. */
export function Label({ className, ...props }: LabelProps): React.JSX.Element {
  return (
    <LabelPrimitive
      className={cn('text-sm leading-snug font-semibold text-ink', className)}
      {...props}
    />
  );
}

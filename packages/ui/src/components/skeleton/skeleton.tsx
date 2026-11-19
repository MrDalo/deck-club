import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { Skeleton as SkeletonPrimitive } from '#ui/skeleton';

/**
 * A placeholder while content loads: quiet Line, pulsing (still when motion
 * is reduced). Decorative: mark the loading region with `aria-busy` and say
 * what is loading in text.
 */
export function Skeleton({
  className,
  ...props
}: ComponentProps<typeof SkeletonPrimitive>): React.JSX.Element {
  return (
    <SkeletonPrimitive aria-hidden className={cn('rounded-xl bg-line', className)} {...props} />
  );
}

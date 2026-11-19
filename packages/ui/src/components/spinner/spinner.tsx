import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import { Spinner as SpinnerPrimitive } from '#ui/spinner';

const SIZES = { sm: 'size-4', md: 'size-5', lg: 'size-8' } as const;

export type SpinnerProps = Omit<ComponentProps<typeof SpinnerPrimitive>, 'aria-label'> & {
  /** What is happening, translated: "Saving", "Loading cards". Announced politely. */
  label: string;
  size?: keyof typeof SIZES;
};

/** Work in progress, in Ink. Still when motion is reduced. */
export function Spinner({
  label,
  size = 'md',
  className,
  ...props
}: SpinnerProps): React.JSX.Element {
  return (
    <SpinnerPrimitive
      aria-label={label}
      className={cn('text-ink', SIZES[size], className)}
      {...props}
    />
  );
}

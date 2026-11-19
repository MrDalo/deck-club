import type { ComponentProps } from 'react';
import { PASTEL_FILL, type Pastel } from '#lib/brand';
import { pastelFor } from '#lib/pastel';
import { cn } from '#lib/utils';
import { AvatarFallback, AvatarImage, Avatar as AvatarPrimitive } from '#ui/avatar';
import { initialsOf } from './initials.js';

const SIZES = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
  xl: 'size-20',
} as const;

/** The initials' type size; set on the fallback, which sets its own. */
const INITIALS_SIZES: Record<keyof typeof SIZES, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

export type AvatarProps = Omit<ComponentProps<typeof AvatarPrimitive>, 'children' | 'size'> & {
  /** The person's or club's name: the accessible name and the initials. */
  name: string;
  /** A picture; the initials show until it loads, or if it fails. */
  src?: string;
  size?: keyof typeof SIZES;
  /** The fallback's pastel; a stable one from the name by default. */
  tone?: Pastel;
  /** A BCP 47 tag for upper-casing the initials. */
  locale?: string;
};

/**
 * A person or a club: their picture, or their initials on their own pastel,
 * in an Ink circle. Announced once, by name.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  tone,
  locale,
  className,
  ...props
}: AvatarProps): React.JSX.Element {
  return (
    <AvatarPrimitive
      role="img"
      aria-label={name}
      className={cn('border-2 border-ink bg-card font-display font-bold', SIZES[size], className)}
      {...props}
    >
      {src !== undefined && <AvatarImage src={src} alt="" />}
      <AvatarFallback
        aria-hidden
        className={cn('text-ink', INITIALS_SIZES[size], PASTEL_FILL[tone ?? pastelFor(name)])}
      >
        {initialsOf(name, locale)}
      </AvatarFallback>
    </AvatarPrimitive>
  );
}

/** Overlapping avatars, as a club's members. Give it an `aria-label`. */
export function AvatarGroup({ className, ...props }: ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      role="group"
      data-slot="avatar-group"
      className={cn(
        'flex items-center -space-x-2 [&>[data-slot=avatar]]:ring-2 [&>[data-slot=avatar]]:ring-paper',
        className,
      )}
      {...props}
    />
  );
}

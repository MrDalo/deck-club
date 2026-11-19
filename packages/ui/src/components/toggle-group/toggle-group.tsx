import type { ComponentProps } from 'react';
import { toggleVariants } from '#components/toggle';
import { cn } from '#lib/utils';
import {
  ToggleGroupItem as ToggleGroupItemPrimitive,
  ToggleGroup as ToggleGroupPrimitive,
} from '#ui/toggle-group';

type Variant = 'ghost' | 'outline';

/** Omit that keeps a union of props a union (single and multiple groups stay distinct). */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Size = 'sm' | 'md' | 'lg';

export type ToggleGroupProps = DistributiveOmit<
  ComponentProps<typeof ToggleGroupPrimitive>,
  'variant' | 'size'
> & {
  variant?: Variant;
  size?: Size;
};

/**
 * Toggles that belong together: one choice (`type="single"`, announced as
 * radio buttons) or several (`type="multiple"`). Outline groups are joined
 * into one sticker. Name it with `aria-label`.
 */
export function ToggleGroup({
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}: ToggleGroupProps): React.JSX.Element {
  return (
    <ToggleGroupPrimitive
      // The primitive passes `variant` to its items; our items read it from `data-variant`.
      variant={variant === 'outline' ? 'outline' : 'default'}
      data-brand-variant={variant}
      data-brand-size={size}
      className={cn(
        'gap-1 rounded-full',
        variant === 'outline' && 'gap-0 shadow-sticker-sm',
        className,
      )}
      {...props}
    />
  );
}

export type ToggleGroupItemProps = Omit<
  ComponentProps<typeof ToggleGroupItemPrimitive>,
  'variant' | 'size'
>;

/** One toggle in the group. Its look follows the group's `variant` and `size`. */
export function ToggleGroupItem({ className, ...props }: ToggleGroupItemProps): React.JSX.Element {
  return (
    <ToggleGroupItemPrimitive
      className={cn(
        toggleVariants({ variant: 'ghost', size: 'md' }),
        'flex-none rounded-full px-3',
        // Sizes follow the group.
        'group-data-[brand-size=sm]/toggle-group:h-9 group-data-[brand-size=sm]/toggle-group:min-w-9 group-data-[brand-size=sm]/toggle-group:text-sm',
        'group-data-[brand-size=lg]/toggle-group:h-13 group-data-[brand-size=lg]/toggle-group:min-w-13 group-data-[brand-size=lg]/toggle-group:text-lg',
        // Outline groups: one joined sticker, neighbours sharing an Ink outline.
        'group-data-[brand-variant=outline]/toggle-group:rounded-none group-data-[brand-variant=outline]/toggle-group:border-ink group-data-[brand-variant=outline]/toggle-group:bg-card group-data-[brand-variant=outline]/toggle-group:data-[state=on]:bg-lilac',
        'group-data-[brand-variant=outline]/toggle-group:first:rounded-l-full group-data-[brand-variant=outline]/toggle-group:last:rounded-r-full',
        'group-data-[brand-variant=outline]/toggle-group:border-l-0 group-data-[brand-variant=outline]/toggle-group:first:border-l-2',
        className,
      )}
      {...props}
    />
  );
}

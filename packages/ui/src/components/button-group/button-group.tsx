import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  ButtonGroup as ButtonGroupPrimitive,
  ButtonGroupSeparator as ButtonGroupSeparatorPrimitive,
  ButtonGroupText as ButtonGroupTextPrimitive,
} from '#ui/button-group';

export type ButtonGroupProps = ComponentProps<typeof ButtonGroupPrimitive>;

/**
 * Sticker buttons joined into one: a single Ink outline between them and a
 * single shadow for the whole group. Give it an `aria-label`.
 */
export function ButtonGroup({
  orientation,
  className,
  ...props
}: ButtonGroupProps): React.JSX.Element {
  return (
    <ButtonGroupPrimitive
      orientation={orientation}
      className={cn(
        'rounded-full shadow-sticker-sm [&>*]:shadow-none [&>*]:active:translate-0',
        orientation === 'vertical' && 'rounded-[1.375rem]',
        className,
      )}
      {...props}
    />
  );
}

/** A non-interactive label inside a group, such as a count or a unit. */
export function ButtonGroupText({
  className,
  ...props
}: ComponentProps<typeof ButtonGroupTextPrimitive>): React.JSX.Element {
  return (
    <ButtonGroupTextPrimitive
      className={cn(
        'rounded-full border-2 border-ink bg-paper px-4 text-sm font-semibold text-ink shadow-none',
        className,
      )}
      {...props}
    />
  );
}

export function ButtonGroupSeparator({
  className,
  ...props
}: ComponentProps<typeof ButtonGroupSeparatorPrimitive>): React.JSX.Element {
  return <ButtonGroupSeparatorPrimitive className={cn('w-0.5 bg-ink/40', className)} {...props} />;
}

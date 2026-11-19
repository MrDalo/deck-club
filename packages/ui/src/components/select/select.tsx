import type { ComponentProps } from 'react';
import { FIELD, FOCUS_RING, MENU_ITEM, SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  SelectContent as SelectContentPrimitive,
  SelectItem as SelectItemPrimitive,
  SelectLabel as SelectLabelPrimitive,
  SelectScrollDownButton as SelectScrollDownButtonPrimitive,
  SelectScrollUpButton as SelectScrollUpButtonPrimitive,
  SelectSeparator as SelectSeparatorPrimitive,
  SelectTrigger as SelectTriggerPrimitive,
} from '#ui/select';

export { Select, SelectGroup, SelectValue } from '#ui/select';

/** The field that opens the list, drawn like every brand field. Name it with a label. */
export function SelectTrigger({
  className,
  ...props
}: ComponentProps<typeof SelectTriggerPrimitive>): React.JSX.Element {
  return (
    <SelectTriggerPrimitive
      className={cn(
        FIELD,
        'justify-between shadow-none data-[placeholder]:text-ink-soft data-[size=default]:h-11 data-[size=sm]:h-9 data-[size=sm]:text-sm',
        '[&_svg:not([class*=text-])]:text-ink [&>svg]:size-5 [&>svg]:opacity-100',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

/** The list: a sticker card. Typing jumps to an option. */
export function SelectContent({
  className,
  ...props
}: ComponentProps<typeof SelectContentPrimitive>): React.JSX.Element {
  return <SelectContentPrimitive className={cn(SURFACE, 'p-0.5', className)} {...props} />;
}

export function SelectItem({
  className,
  ...props
}: ComponentProps<typeof SelectItemPrimitive>): React.JSX.Element {
  return (
    <SelectItemPrimitive
      className={cn(MENU_ITEM, 'pr-8 text-base [&_svg:not([class*=text-])]:text-ink', className)}
      {...props}
    />
  );
}

export function SelectLabel({
  className,
  ...props
}: ComponentProps<typeof SelectLabelPrimitive>): React.JSX.Element {
  return (
    <SelectLabelPrimitive
      className={cn(
        'px-2.5 pt-2 pb-1 text-xs font-bold tracking-wide text-ink-soft uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof SelectSeparatorPrimitive>): React.JSX.Element {
  return (
    <SelectSeparatorPrimitive className={cn('mx-0 my-1.5 h-0.5 bg-line', className)} {...props} />
  );
}

export function SelectScrollUpButton({
  className,
  ...props
}: ComponentProps<typeof SelectScrollUpButtonPrimitive>): React.JSX.Element {
  return <SelectScrollUpButtonPrimitive className={cn('text-ink', className)} {...props} />;
}

export function SelectScrollDownButton({
  className,
  ...props
}: ComponentProps<typeof SelectScrollDownButtonPrimitive>): React.JSX.Element {
  return <SelectScrollDownButtonPrimitive className={cn('text-ink', className)} {...props} />;
}

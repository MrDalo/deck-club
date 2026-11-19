import type { ComponentProps } from 'react';
import { cn } from '#lib/utils';
import {
  NativeSelectOptGroup as NativeSelectOptGroupPrimitive,
  NativeSelectOption as NativeSelectOptionPrimitive,
  NativeSelect as NativeSelectPrimitive,
} from '#ui/native-select';

export type NativeSelectProps = ComponentProps<typeof NativeSelectPrimitive>;

/*
 * shadcn puts `className` on the wrapper around the <select>, so the brand
 * field (FIELD and FOCUS_RING in #lib/brand) reaches the select through
 * `[&>select]:`, written out in full so Tailwind generates each class. The
 * wrapper already dims a disabled select, so the select itself never does.
 */
const BRAND_SELECT = [
  '[&>select]:h-11 [&>select]:rounded-xl [&>select]:border-2 [&>select]:border-ink/80 [&>select]:bg-card',
  '[&>select]:py-0 [&>select]:pr-10 [&>select]:pl-3.5 [&>select]:text-base [&>select]:text-ink [&>select]:shadow-none',
  '[&>select]:aria-invalid:border-danger [&>select]:aria-invalid:bg-rose/20 [&>select]:aria-invalid:ring-0',
  '[&>select]:outline-none [&>select]:focus-visible:border-ink [&>select]:focus-visible:ring-0',
  '[&>select]:focus-visible:outline-3 [&>select]:focus-visible:outline-offset-2 [&>select]:focus-visible:outline-focus [&>select]:focus-visible:outline-solid',
];

/** The Ink chevron that marks the field as a select. */
const BRAND_ICON =
  '[&>[data-slot=native-select-icon]]:right-3.5 [&>[data-slot=native-select-icon]]:size-5 [&>[data-slot=native-select-icon]]:text-ink';

/**
 * The browser's own select in the brand field: reliable on phones and with
 * every assistive technology. `className` sizes the field (it is full width
 * by default); the Ink chevron marks it as a select.
 */
export function NativeSelect({ className, ...props }: NativeSelectProps): React.JSX.Element {
  return (
    <NativeSelectPrimitive
      className={cn('w-full', BRAND_SELECT, BRAND_ICON, className)}
      {...props}
    />
  );
}

export function NativeSelectOption(
  props: ComponentProps<typeof NativeSelectOptionPrimitive>,
): React.JSX.Element {
  return <NativeSelectOptionPrimitive {...props} />;
}

export function NativeSelectOptGroup(
  props: ComponentProps<typeof NativeSelectOptGroupPrimitive>,
): React.JSX.Element {
  return <NativeSelectOptGroupPrimitive {...props} />;
}

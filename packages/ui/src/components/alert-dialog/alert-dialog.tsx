import { AlertDialog as AlertDialogRadix } from 'radix-ui';
import type { ComponentProps } from 'react';
import { Button } from '#components/button';
import { SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  AlertDialogContent as AlertDialogContentPrimitive,
  AlertDialogDescription as AlertDialogDescriptionPrimitive,
  AlertDialogFooter as AlertDialogFooterPrimitive,
  AlertDialogHeader as AlertDialogHeaderPrimitive,
  AlertDialogTitle as AlertDialogTitlePrimitive,
} from '#ui/alert-dialog';

export { AlertDialog, AlertDialogTrigger } from '#ui/alert-dialog';

/** The confirmation itself: a sticker card over the page. */
export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogContentPrimitive>): React.JSX.Element {
  return (
    <AlertDialogContentPrimitive
      className={cn(SURFACE, 'gap-5 rounded-card p-6 sm:max-w-md', className)}
      {...props}
    />
  );
}

export function AlertDialogHeader({
  className,
  ...props
}: ComponentProps<typeof AlertDialogHeaderPrimitive>): React.JSX.Element {
  return <AlertDialogHeaderPrimitive className={cn('text-left', className)} {...props} />;
}

export function AlertDialogFooter({
  className,
  ...props
}: ComponentProps<typeof AlertDialogFooterPrimitive>): React.JSX.Element {
  return <AlertDialogFooterPrimitive className={cn('gap-3', className)} {...props} />;
}

/** Says what will happen, as a question: "Delete this deck?". */
export function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialogTitlePrimitive>): React.JSX.Element {
  return (
    <AlertDialogTitlePrimitive
      className={cn('font-display text-xl font-bold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogDescriptionPrimitive>): React.JSX.Element {
  return (
    <AlertDialogDescriptionPrimitive
      className={cn('text-base text-ink-soft', className)}
      {...props}
    />
  );
}

type AlertDialogActionProps = Omit<ComponentProps<typeof Button>, 'variant'> & {
  /** `danger` for an action that destroys something. */
  variant?: 'primary' | 'danger';
};

/*
 * shadcn's Action and Cancel wrap themselves in its own Button, whose classes
 * would be joined with the brand's instead of merged. Radix supplies the
 * behaviour here and the branded Button the whole look.
 */

/** Confirms. Name it with the verb ("Delete deck"), never "OK". */
export function AlertDialogAction({
  variant = 'primary',
  ...props
}: AlertDialogActionProps): React.JSX.Element {
  return (
    <AlertDialogRadix.Action asChild>
      <Button data-slot="alert-dialog-action" variant={variant} {...props} />
    </AlertDialogRadix.Action>
  );
}

/** Backs out. Focused first, so a stray Enter never destroys anything. */
export function AlertDialogCancel(
  props: Omit<ComponentProps<typeof Button>, 'variant'>,
): React.JSX.Element {
  return (
    <AlertDialogRadix.Cancel asChild>
      <Button data-slot="alert-dialog-cancel" variant="secondary" {...props} />
    </AlertDialogRadix.Cancel>
  );
}

import { XIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '#components/button';
import { SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  DialogClose,
  DialogContent as DialogContentPrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogFooter as DialogFooterPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
} from '#ui/dialog';

export { Dialog, DialogClose, DialogTrigger } from '#ui/dialog';

/** A close button needs a translated name; or leave it out on purpose. */
type CloseButton =
  { closeLabel: string; showCloseButton?: true } | { showCloseButton: false; closeLabel?: never };

export type DialogContentProps = Omit<
  ComponentProps<typeof DialogContentPrimitive>,
  'showCloseButton'
> &
  CloseButton;

/**
 * A modal on a sticker card. Focus stays inside until it closes (Escape, the
 * close button, or an action). The close button is named in the page's
 * language with `closeLabel`.
 */
export function DialogContent({
  closeLabel,
  showCloseButton = true,
  className,
  children,
  ...props
}: DialogContentProps): React.JSX.Element {
  return (
    <DialogContentPrimitive
      showCloseButton={false}
      className={cn(SURFACE, 'gap-5 rounded-card p-6 sm:max-w-lg', className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={closeLabel}
            className="absolute top-3 right-3"
          >
            <XIcon aria-hidden />
          </Button>
        </DialogClose>
      )}
    </DialogContentPrimitive>
  );
}

export function DialogHeader({
  className,
  ...props
}: ComponentProps<typeof DialogHeaderPrimitive>): React.JSX.Element {
  return <DialogHeaderPrimitive className={cn('gap-1.5 pr-8 text-left', className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: ComponentProps<typeof DialogFooterPrimitive>): React.JSX.Element {
  return <DialogFooterPrimitive className={cn('gap-3', className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogTitlePrimitive>): React.JSX.Element {
  return (
    <DialogTitlePrimitive
      className={cn(
        'font-display text-xl leading-tight font-bold tracking-tight text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogDescriptionPrimitive>): React.JSX.Element {
  return (
    <DialogDescriptionPrimitive className={cn('text-base text-ink-soft', className)} {...props} />
  );
}

import { XIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '#components/button';
import { cn } from '#lib/utils';
import {
  SheetClose,
  SheetContent as SheetContentPrimitive,
  SheetDescription as SheetDescriptionPrimitive,
  SheetFooter as SheetFooterPrimitive,
  SheetHeader as SheetHeaderPrimitive,
  SheetTitle as SheetTitlePrimitive,
} from '#ui/sheet';

export { Sheet, SheetClose, SheetTrigger } from '#ui/sheet';

type Side = 'top' | 'right' | 'bottom' | 'left';

const SIDES: Record<Side, string> = {
  right: 'border-l-2 rounded-l-card sm:max-w-md',
  left: 'border-r-2 rounded-r-card sm:max-w-md',
  top: 'border-b-2 rounded-b-card',
  bottom: 'border-t-2 rounded-t-card',
};

/** A close button needs a translated name; or leave it out on purpose. */
type CloseButton =
  { closeLabel: string; showCloseButton?: true } | { showCloseButton: false; closeLabel?: never };

export type SheetContentProps = Omit<ComponentProps<typeof SheetContentPrimitive>, 'side'> &
  CloseButton & { side?: Side };

/**
 * A panel along an edge, over the page: deck settings, filters, the card
 * editor on a phone. Focus stays inside until it closes.
 *
 * shadcn's Sheet always adds a close button named "Close" in English; it is
 * hidden here (display: none, so assistive technology skips it too) and a
 * translated one takes its place.
 */
export function SheetContent({
  closeLabel,
  showCloseButton = true,
  side = 'right',
  className,
  children,
  ...props
}: SheetContentProps): React.JSX.Element {
  return (
    <SheetContentPrimitive
      side={side}
      className={cn(
        'gap-0 border-ink bg-card text-ink shadow-none',
        SIDES[side],
        '[&>button:last-child]:hidden',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={closeLabel}
            className="absolute top-3 right-3"
          >
            <XIcon aria-hidden />
          </Button>
        </SheetClose>
      )}
    </SheetContentPrimitive>
  );
}

export function SheetHeader({
  className,
  ...props
}: ComponentProps<typeof SheetHeaderPrimitive>): React.JSX.Element {
  return <SheetHeaderPrimitive className={cn('gap-1.5 p-5 pr-14', className)} {...props} />;
}

export function SheetFooter({
  className,
  ...props
}: ComponentProps<typeof SheetFooterPrimitive>): React.JSX.Element {
  return <SheetFooterPrimitive className={cn('gap-3 p-5', className)} {...props} />;
}

export function SheetTitle({
  className,
  ...props
}: ComponentProps<typeof SheetTitlePrimitive>): React.JSX.Element {
  return (
    <SheetTitlePrimitive
      className={cn('font-display text-xl font-bold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetDescriptionPrimitive>): React.JSX.Element {
  return (
    <SheetDescriptionPrimitive className={cn('text-base text-ink-soft', className)} {...props} />
  );
}

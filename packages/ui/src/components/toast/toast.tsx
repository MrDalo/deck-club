import type { ComponentProps } from 'react';
import { buttonVariants } from '#components/button';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Toaster as ToasterPrimitive } from '#ui/sonner';

export { toast } from 'sonner';

export type ToasterProps = Omit<
  ComponentProps<typeof ToasterPrimitive>,
  'customAriaLabel' | 'containerAriaLabel'
> & {
  /** Names the notifications region, translated ("Notifications"). */
  label: string;
  /** Names each toast's close button, translated ("Dismiss"). */
  closeLabel: string;
};

/**
 * Where toasts appear: short confirmations that come and go ("Card added."),
 * announced politely. Render it once, near the root; call `toast()` anywhere.
 * Each toast is a sticker, filled by its kind: success Mint, error Rose,
 * warning Peach, info Sky.
 */
export function Toaster({
  label,
  closeLabel,
  toastOptions,
  ...props
}: ToasterProps): React.JSX.Element {
  return (
    <ToasterPrimitive
      // shadcn's Toaster reads next-themes, which Deck Club does not provide (light only).
      theme="light"
      customAriaLabel={label}
      toastOptions={{
        ...toastOptions,
        closeButtonAriaLabel: closeLabel,
        // Sonner's own styles out-rank utility classes; the brand draws every part.
        unstyled: true,
        classNames: {
          toast:
            'group flex w-full items-start gap-3 rounded-2xl border-2 border-ink bg-card p-4 text-ink shadow-sticker font-sans',
          title: 'font-bold leading-snug',
          description: 'text-sm text-ink',
          icon: 'mt-0.5 [&_svg]:size-5 [&_svg]:text-ink',
          content: 'flex flex-1 flex-col gap-0.5',
          actionButton: cn(buttonVariants({ size: 'sm' }), 'shrink-0'),
          cancelButton: cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'shrink-0'),
          closeButton: cn(
            'absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-ink bg-card text-ink hover:bg-butter [&_svg]:size-3',
            FOCUS_RING,
          ),
          success: 'bg-mint',
          error: 'bg-rose',
          warning: 'bg-peach',
          info: 'bg-sky',
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
}

import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Button as ButtonPrimitive } from '#ui/button';

/**
 * Sticker buttons: Ink outline, pastel fill and a hard offset shadow that
 * flattens when pressed. Text is always Ink, so every variant passes WCAG AA.
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink font-semibold whitespace-nowrap text-ink',
    'transition-[transform,box-shadow,background-color] duration-100',
    'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    FOCUS_RING,
  ],
  {
    variants: {
      variant: {
        primary: 'bg-lilac shadow-sticker-sm hover:bg-[#c2b2fa]',
        secondary: 'bg-card shadow-sticker-sm hover:bg-paper',
        danger: 'bg-rose shadow-sticker-sm hover:bg-[#f6b1c4]',
        ghost: 'border-transparent bg-transparent shadow-none hover:bg-line/60 active:translate-0',
        link: 'border-transparent bg-transparent shadow-none underline decoration-2 underline-offset-4 hover:decoration-focus active:translate-0',
      },
      size: {
        sm: 'h-9 px-4 text-sm has-[>svg]:px-3.5',
        md: 'h-11 px-5 text-base has-[>svg]:px-4',
        lg: 'h-13 px-7 text-lg has-[>svg]:px-6',
        icon: 'size-11 p-0 has-[>svg]:p-0',
        'icon-sm': 'size-9 p-0 has-[>svg]:p-0',
      },
    },
    // A link reads as text: no box to size.
    compoundVariants: [{ variant: 'link', className: 'h-auto p-0 has-[>svg]:p-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = Omit<ComponentProps<typeof ButtonPrimitive>, 'variant' | 'size'> &
  VariantProps<typeof buttonVariants>;

/**
 * The Deck Club button. `asChild` styles a link (a Next.js `Link`) as a
 * button. Without `asChild` it defaults to `type="button"`, so it never
 * submits a form by accident.
 */
export function Button({
  variant,
  size,
  asChild = false,
  className,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <ButtonPrimitive
      {...(asChild ? {} : { type: 'button' as const })}
      asChild={asChild}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

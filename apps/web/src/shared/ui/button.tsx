import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../lib/cn';

/** Sticker-style buttons: ink outline, pastel fill, a hard offset shadow that flattens when pressed. */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full border-2 border-ink font-semibold whitespace-nowrap transition-[transform,box-shadow] duration-100 disabled:pointer-events-none disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  {
    variants: {
      variant: {
        primary: 'bg-lilac text-ink shadow-sticker-sm hover:bg-[#c2b2fa]',
        secondary: 'bg-card text-ink shadow-sticker-sm hover:bg-paper',
        danger: 'bg-rose text-ink shadow-sticker-sm hover:bg-[#f6b1c4]',
        ghost:
          'border-transparent bg-transparent text-ink shadow-none hover:bg-line/60 active:translate-0',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-13 px-7 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (a Link) with button styling instead of a <button>. */
    asChild?: boolean;
  };

/** The one button. Use `asChild` to style a link. */
export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  if (asChild)
    return <Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

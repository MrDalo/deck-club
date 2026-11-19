import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's default scales. Without the brand's
 * own tokens (theme.css) `shadow-sticker-sm` and `shadow-none` would not be
 * seen as conflicting, both would stay, and an override passed through
 * `className` would silently lose to stylesheet order.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      shadow: ['sticker', 'sticker-sm'],
      radius: ['card'],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, last one wins. The
 * `utils` alias of components.json: shadcn primitives use it too.
 * @param inputs - class names, arrays or conditional objects
 * @returns one class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

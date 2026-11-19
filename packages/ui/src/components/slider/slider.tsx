'use client';

import { Slider as SliderPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';

export type SliderProps = ComponentProps<typeof SliderPrimitive.Root> & {
  /**
   * Each thumb's name, translated: one string for one thumb, one per thumb
   * for a range (["Fewest cards", "Most cards"]).
   */
  thumbLabels: string | readonly string[];
};

/**
 * A value on a scale: new cards a day, a range of intervals. An Ink-outlined
 * track filling Lilac, with sticker thumbs; arrow keys, Page Up/Down, Home
 * and End move them.
 *
 * Built on Radix directly rather than shadcn's Slider: that one renders its
 * thumbs itself and leaves no way to name them.
 */
export function Slider({
  thumbLabels,
  min = 0,
  max = 100,
  className,
  ...props
}: SliderProps): React.JSX.Element {
  const labels = typeof thumbLabels === 'string' ? [thumbLabels] : thumbLabels;
  const thumbs = (props.value ?? props.defaultValue ?? [min]).length;
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      min={min}
      max={max}
      className={cn(
        // As tall (or wide) as the thumbs, which Radix positions absolutely.
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=horizontal]:h-7',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-7 data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full border-2 border-ink bg-card data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-lilac data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbs }, (_, index) => (
        <SliderPrimitive.Thumb
          // Thumbs are positional: Radix keys its own state by index too.
          key={index}
          data-slot="slider-thumb"
          aria-label={labels[index] ?? labels.at(-1)}
          className={cn(
            'block size-6 shrink-0 rounded-full border-2 border-ink bg-card shadow-sticker-sm hover:bg-butter disabled:pointer-events-none',
            FOCUS_RING,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

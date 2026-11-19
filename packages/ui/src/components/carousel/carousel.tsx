'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from 'react';
import { buttonVariants } from '#components/button';
import { cn } from '#lib/utils';
import {
  CarouselContent as CarouselContentPrimitive,
  CarouselItem as CarouselItemPrimitive,
  CarouselNext as CarouselNextPrimitive,
  CarouselPrevious as CarouselPreviousPrimitive,
  Carousel as CarouselPrimitive,
  type CarouselApi,
} from '#ui/carousel';

export type { CarouselApi } from '#ui/carousel';

const CarouselApiContext = createContext<CarouselApi>(undefined);

export type CarouselProps = ComponentProps<typeof CarouselPrimitive> & {
  /** Names the carousel region, translated ("Cards in Biology exam"). */
  label: string;
};

/**
 * Slides in a row: flashcards, deck covers, onboarding steps. Arrow keys move
 * between slides. Give the previous and next buttons room (`mx-12`) or place
 * them yourself.
 */
export function Carousel({
  label,
  orientation = 'horizontal',
  setApi,
  className,
  children,
  ...props
}: CarouselProps): React.JSX.Element {
  const [api, setOwnApi] = useState<CarouselApi>();
  const handleApi = useCallback(
    (next: CarouselApi) => {
      setOwnApi(next);
      setApi?.(next);
    },
    [setApi],
  );
  return (
    <CarouselApiContext.Provider value={api}>
      <CarouselPrimitive
        aria-label={label}
        orientation={orientation}
        setApi={handleApi}
        data-orientation={orientation}
        className={cn('group/carousel', className)}
        {...props}
      >
        {children}
      </CarouselPrimitive>
    </CarouselApiContext.Provider>
  );
}

export function CarouselContent(
  props: ComponentProps<typeof CarouselContentPrimitive>,
): React.JSX.Element {
  return <CarouselContentPrimitive {...props} />;
}

/** A slide. Name it for screen readers when its content does not ("Card 2 of 5"). */
export function CarouselItem(
  props: ComponentProps<typeof CarouselItemPrimitive>,
): React.JSX.Element {
  return <CarouselItemPrimitive {...props} />;
}

/**
 * The sticker press moves a button 2px; these buttons are also centred with a
 * translate, so a press keeps the centring and only drops the shadow.
 */
const NAV_BUTTON = cn(
  buttonVariants({ variant: 'secondary', size: 'icon-sm' }),
  'group-data-[orientation=horizontal]/carousel:active:translate-x-0 group-data-[orientation=horizontal]/carousel:active:-translate-y-1/2',
  'group-data-[orientation=vertical]/carousel:active:-translate-x-1/2 group-data-[orientation=vertical]/carousel:active:translate-y-0',
);

type CarouselNavProps = Omit<
  ComponentProps<typeof CarouselPreviousPrimitive>,
  'variant' | 'size'
> & {
  /** The button's name, translated ("Previous card"). */
  label: string;
};

export function CarouselPrevious({
  label,
  className,
  ...props
}: CarouselNavProps): React.JSX.Element {
  return (
    <CarouselPreviousPrimitive
      aria-label={label}
      className={cn(NAV_BUTTON, className)}
      {...props}
    />
  );
}

export function CarouselNext({ label, className, ...props }: CarouselNavProps): React.JSX.Element {
  return (
    <CarouselNextPrimitive aria-label={label} className={cn(NAV_BUTTON, className)} {...props} />
  );
}

type CarouselStatusProps = Omit<ComponentProps<'p'>, 'children'> & {
  /** Writes the position, translated: `(current, total) => \`${current} / ${total}\``. */
  format: (current: number, total: number) => string;
};

/** Where you are ("2 / 5"), announced politely when the slide changes. */
export function CarouselStatus({
  format,
  className,
  ...props
}: CarouselStatusProps): React.JSX.Element {
  const api = useContext(CarouselApiContext);
  const subscribe = useCallback(
    (onChange: () => void) => {
      api?.on('select', onChange).on('reInit', onChange);
      return () => {
        api?.off('select', onChange).off('reInit', onChange);
      };
    },
    [api],
  );
  const current = useSyncExternalStore(
    subscribe,
    () => (api?.selectedScrollSnap() ?? 0) + 1,
    () => 1,
  );
  const total = useSyncExternalStore(
    subscribe,
    () => api?.scrollSnapList().length ?? 0,
    () => 0,
  );
  return (
    <p
      aria-live="polite"
      aria-atomic
      className={cn('text-center text-sm font-semibold text-ink-soft tabular-nums', className)}
      {...props}
    >
      {total > 0 ? format(current, total) : null}
    </p>
  );
}

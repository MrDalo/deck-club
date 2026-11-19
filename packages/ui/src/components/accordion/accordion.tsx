import type { ComponentProps } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  AccordionContent as AccordionContentPrimitive,
  AccordionItem as AccordionItemPrimitive,
  Accordion as AccordionPrimitive,
  AccordionTrigger as AccordionTriggerPrimitive,
} from '#ui/accordion';

export type AccordionProps = ComponentProps<typeof AccordionPrimitive> & {
  /** `plain`: items divided by a rule. `cards`: every item a sticker card. */
  variant?: 'plain' | 'cards';
};

/** Questions and answers, settings sections, "How does it work?". */
export function Accordion({
  variant = 'plain',
  className,
  ...props
}: AccordionProps): React.JSX.Element {
  return (
    <AccordionPrimitive
      data-variant={variant}
      className={cn('group/accordion w-full', variant === 'cards' && 'space-y-3', className)}
      {...props}
    />
  );
}

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionItemPrimitive>): React.JSX.Element {
  return (
    <AccordionItemPrimitive
      className={cn(
        'border-b-2 border-line',
        'group-data-[variant=cards]/accordion:rounded-2xl group-data-[variant=cards]/accordion:border-2 group-data-[variant=cards]/accordion:border-ink group-data-[variant=cards]/accordion:bg-card group-data-[variant=cards]/accordion:px-4 group-data-[variant=cards]/accordion:shadow-sticker-sm group-data-[variant=cards]/accordion:last:border-b-2',
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  ...props
}: ComponentProps<typeof AccordionTriggerPrimitive>): React.JSX.Element {
  return (
    <AccordionTriggerPrimitive
      className={cn(
        'items-center py-4 font-display text-base font-bold text-ink hover:no-underline [&>svg]:size-5 [&>svg]:translate-y-0 [&>svg]:text-ink',
        '[&[data-state=open]]:[&>svg]:rotate-180',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export function AccordionContent({
  className,
  ...props
}: ComponentProps<typeof AccordionContentPrimitive>): React.JSX.Element {
  return (
    <AccordionContentPrimitive className={cn('pb-4 text-base text-ink', className)} {...props} />
  );
}

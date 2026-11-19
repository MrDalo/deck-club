import { cva } from 'class-variance-authority';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LightbulbIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '#lib/utils';
import {
  AlertDescription as AlertDescriptionPrimitive,
  Alert as AlertPrimitive,
  AlertTitle as AlertTitlePrimitive,
} from '#ui/alert';

type AlertTone = 'info' | 'success' | 'warning' | 'danger' | 'note';

/**
 * Each tone: its wash, its icon, and how loudly a screen reader announces it.
 * Only warnings and errors interrupt (`alert`); the rest wait (`status`).
 */
const TONES: Record<AlertTone, { icon: LucideIcon; role: 'alert' | 'status' }> = {
  info: { icon: InfoIcon, role: 'status' },
  success: { icon: CircleCheckIcon, role: 'status' },
  warning: { icon: TriangleAlertIcon, role: 'alert' },
  danger: { icon: CircleAlertIcon, role: 'alert' },
  note: { icon: LightbulbIcon, role: 'status' },
};

const alertVariants = cva(
  'rounded-2xl border-2 border-ink/80 px-4 py-3 text-base text-ink has-[>svg]:gap-x-3 [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-ink',
  {
    variants: {
      tone: {
        info: 'bg-sky/60',
        success: 'bg-mint/60',
        warning: 'bg-peach/60',
        danger: 'bg-rose/50',
        note: 'bg-butter/60',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

export type AlertProps = Omit<ComponentProps<typeof AlertPrimitive>, 'variant'> & {
  tone?: AlertTone;
  /** Replaces the tone's icon; `false` shows none. */
  icon?: ReactNode | false;
};

/** An inline message in a pastel wash. Text stays Ink on every tone. */
export function Alert({
  tone = 'info',
  icon,
  role,
  className,
  children,
  ...props
}: AlertProps): React.JSX.Element {
  const { icon: ToneIcon, role: toneRole } = TONES[tone];
  return (
    <AlertPrimitive
      role={role ?? toneRole}
      data-tone={tone}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {icon === undefined ? <ToneIcon aria-hidden /> : icon}
      {children}
    </AlertPrimitive>
  );
}

export function AlertTitle({
  className,
  ...props
}: ComponentProps<typeof AlertTitlePrimitive>): React.JSX.Element {
  return (
    <AlertTitlePrimitive
      className={cn('line-clamp-none font-bold tracking-normal', className)}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDescriptionPrimitive>): React.JSX.Element {
  return <AlertDescriptionPrimitive className={cn('text-base text-ink', className)} {...props} />;
}

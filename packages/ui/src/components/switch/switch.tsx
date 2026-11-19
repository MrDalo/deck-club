import { useId, type ComponentProps, type ReactNode } from 'react';
import { FOCUS_RING } from '#lib/brand';
import { cn } from '#lib/utils';
import { Switch as SwitchPrimitive } from '#ui/switch';
import { Label } from '#components/label';

/**
 * On or off, taking effect at once: reminders, sound. An Ink track whose
 * Ink-ringed thumb slides right and sits on Lilac when on; the position
 * says it, not the colour.
 */
export function Switch({
  className,
  ...props
}: ComponentProps<typeof SwitchPrimitive>): React.JSX.Element {
  return (
    <SwitchPrimitive
      className={cn(
        'h-7 w-12 border-2 border-ink shadow-none data-[state=checked]:bg-lilac data-[state=unchecked]:bg-line',
        '[&>[data-slot=switch-thumb]]:size-5 [&>[data-slot=switch-thumb]]:border-2 [&>[data-slot=switch-thumb]]:border-ink [&>[data-slot=switch-thumb]]:bg-card',
        '[&>[data-slot=switch-thumb]]:data-[state=unchecked]:translate-x-0.5 [&>[data-slot=switch-thumb]]:data-[state=checked]:translate-x-[1.375rem]',
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export type SwitchFieldProps = ComponentProps<typeof Switch> & {
  label: ReactNode;
  description?: ReactNode;
};

/**
 * A settings row: label and description on the left, the switch on the
 * right. Named with `aria-labelledby`, because a switch is a button.
 */
export function SwitchField({
  label,
  description,
  id,
  className,
  ...props
}: SwitchFieldProps): React.JSX.Element {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="grid gap-1">
        <Label id={`${switchId}-label`} htmlFor={switchId} className="text-base">
          {label}
        </Label>
        {description !== undefined && (
          <p id={`${switchId}-description`} className="text-sm text-ink-soft">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={switchId}
        aria-labelledby={`${switchId}-label`}
        aria-describedby={description === undefined ? undefined : `${switchId}-description`}
        {...props}
      />
    </div>
  );
}

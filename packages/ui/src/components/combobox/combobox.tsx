'use client';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#components/command';
import { FIELD, FOCUS_RING, SURFACE } from '#lib/brand';
import { useControllableState } from '#lib/use-controllable-state';
import { cn } from '#lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '#ui/popover';
import { groupOptions, type ComboboxOption } from './group-options.js';

export type ComboboxProps = Omit<
  ComponentProps<'button'>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> & {
  options: readonly ComboboxOption[];
  /** The chosen option's value; `null` for none. Leave out to let the box keep it. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Shown before anything is chosen, translated ("Choose a language"). */
  placeholder: string;
  /** The search field's placeholder, translated ("Search languages"). */
  searchPlaceholder: string;
  /** Shown when the search matches nothing, translated. */
  emptyMessage: string;
  /** Classes for the popover, e.g. a fixed width. */
  contentClassName?: string;
};

/**
 * Picks one option from a searchable list: a deck's language, a club, a tag.
 * Type to filter; arrows and Enter choose. ARIA's "combobox with a dialog
 * popup": the trigger opens a dialog holding the search field and the list.
 */
export function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  contentClassName,
  className,
  ...props
}: ComboboxProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const chosen = options.find((option) => option.value === selected);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(FIELD, FOCUS_RING, 'justify-between', className)}
          {...props}
        >
          <span className={cn('truncate', chosen === undefined && 'text-ink-soft')}>
            {chosen?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon aria-hidden className="size-5 shrink-0 text-ink" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(SURFACE, 'w-(--radix-popover-trigger-width) min-w-56 p-0', contentClassName)}
      >
        <Command variant="bare" label={searchPlaceholder}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList label={placeholder}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {groupOptions(options).map(({ heading, items }) => (
              <CommandGroup key={heading ?? ''} {...(heading === undefined ? {} : { heading })}>
                {items.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label, ...(option.keywords ?? [])]}
                    disabled={option.disabled === true}
                    onSelect={() => {
                      setSelected(option.value);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      aria-hidden
                      className={cn(
                        'size-4',
                        option.value === selected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

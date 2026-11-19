import type { ComponentProps } from 'react';
import { SURFACE } from '#lib/brand';
import { cn } from '#lib/utils';
import {
  CommandEmpty as CommandEmptyPrimitive,
  CommandGroup as CommandGroupPrimitive,
  CommandInput as CommandInputPrimitive,
  CommandItem as CommandItemPrimitive,
  CommandList as CommandListPrimitive,
  Command as CommandPrimitive,
  CommandSeparator as CommandSeparatorPrimitive,
  CommandShortcut as CommandShortcutPrimitive,
} from '#ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#ui/dialog';

/** The search row: taller, a 2px rule under it, the icon in Ink soft. */
const INPUT_ROW =
  '**:data-[slot=command-input-wrapper]:h-12 **:data-[slot=command-input-wrapper]:gap-2.5 **:data-[slot=command-input-wrapper]:border-b-2 **:data-[slot=command-input-wrapper]:border-line **:data-[slot=command-input-wrapper]:px-4 [&_[data-slot=command-input-wrapper]_svg]:size-5 [&_[data-slot=command-input-wrapper]_svg]:text-ink-soft [&_[data-slot=command-input-wrapper]_svg]:opacity-100';

export type CommandProps = Omit<ComponentProps<typeof CommandPrimitive>, 'label'> & {
  /** Names the search field for screen readers, translated ("Search decks"). */
  label: string;
  /** `sticker`: a card of its own. `bare`: inside a popover or dialog that draws the card. */
  variant?: 'sticker' | 'bare';
};

/** A searchable list of actions or options, driven from the keyboard. */
export function Command({
  variant = 'sticker',
  className,
  ...props
}: CommandProps): React.JSX.Element {
  return (
    <CommandPrimitive
      className={cn(
        'bg-card text-ink',
        INPUT_ROW,
        variant === 'sticker' ? cn(SURFACE, 'rounded-card') : 'rounded-none bg-transparent',
        className,
      )}
      {...props}
    />
  );
}

export function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandInputPrimitive>): React.JSX.Element {
  return (
    <CommandInputPrimitive
      className={cn('h-12 text-base text-ink placeholder:text-ink-soft', className)}
      {...props}
    />
  );
}

export type CommandListProps = Omit<ComponentProps<typeof CommandListPrimitive>, 'label'> & {
  /** Names the list of results, translated; cmdk's default is the English "Suggestions". */
  label: string;
};

export function CommandList({ className, ...props }: CommandListProps): React.JSX.Element {
  return <CommandListPrimitive className={cn('max-h-80 p-1.5', className)} {...props} />;
}

/** Shown when nothing matches: say so, and what to try. */
export function CommandEmpty({
  className,
  ...props
}: ComponentProps<typeof CommandEmptyPrimitive>): React.JSX.Element {
  return (
    <CommandEmptyPrimitive
      className={cn('px-4 py-8 text-center text-base text-ink-soft', className)}
      {...props}
    />
  );
}

export function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandGroupPrimitive>): React.JSX.Element {
  return (
    <CommandGroupPrimitive
      className={cn(
        'p-0 text-ink [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-ink-soft [&_[cmdk-group-heading]]:uppercase',
        className,
      )}
      {...props}
    />
  );
}

/** A row. The highlighted row (hover or arrow keys) gets the Butter highlighter. */
export function CommandItem({
  className,
  ...props
}: ComponentProps<typeof CommandItemPrimitive>): React.JSX.Element {
  return (
    <CommandItemPrimitive
      className={cn(
        'gap-2.5 rounded-lg px-2.5 py-2 text-base text-ink data-[selected=true]:bg-butter data-[selected=true]:text-ink [&_svg:not([class*=text-])]:text-ink',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A visual break between groups. Hidden from assistive technology: a list
 * box may only hold options and groups, and the groups already carry the
 * structure (cmdk gives separators `role="separator"`).
 */
export function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandSeparatorPrimitive>): React.JSX.Element {
  return (
    <CommandSeparatorPrimitive
      aria-hidden
      className={cn('mx-0 my-1.5 h-0.5 bg-line', className)}
      {...props}
    />
  );
}

export function CommandShortcut({
  className,
  ...props
}: ComponentProps<typeof CommandShortcutPrimitive>): React.JSX.Element {
  return (
    <CommandShortcutPrimitive
      className={cn('font-semibold tracking-normal text-ink-soft', className)}
      {...props}
    />
  );
}

export type CommandDialogProps = ComponentProps<typeof Dialog> & {
  /** The dialog's name, and its search field's, translated ("Search Deck Club"). */
  title: string;
  /** What it does, for screen readers, translated. */
  description: string;
  className?: string;
};

/**
 * The command palette: Command in a dialog (⌘K). Escape closes it; there is
 * no English "Close" button. Composed from the dialog primitives rather than
 * shadcn's CommandDialog, which leaves cmdk's search field without a name.
 */
export function CommandDialog({
  title,
  description,
  className,
  children,
  ...props
}: CommandDialogProps): React.JSX.Element {
  return (
    <Dialog {...props}>
      <DialogContent
        showCloseButton={false}
        className={cn(SURFACE, 'gap-0 overflow-hidden rounded-card p-0 sm:max-w-lg', className)}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command variant="bare" label={title}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

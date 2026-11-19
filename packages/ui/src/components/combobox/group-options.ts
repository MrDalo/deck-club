/** One choice in a combobox. */
export type ComboboxOption = {
  value: string;
  /** What people read and search. */
  label: string;
  /** Options with the same group are listed together under it. */
  group?: string;
  /** More words that find this option ("Slovak" for "Slovenčina"). */
  keywords?: readonly string[];
  disabled?: boolean;
};

/** A run of options under one heading; no heading for ungrouped options. */
type OptionGroup = { heading: string | undefined; items: ComboboxOption[] };

/**
 * Gathers options by their group, groups in the order they first appear,
 * options in their given order within a group.
 * @param options - the options, grouped or not
 * @returns the groups to render
 */
export function groupOptions(options: readonly ComboboxOption[]): OptionGroup[] {
  const groups = new Map<string | undefined, ComboboxOption[]>();
  for (const option of options) {
    const items = groups.get(option.group) ?? [];
    items.push(option);
    groups.set(option.group, items);
  }
  return Array.from(groups, ([heading, items]) => ({ heading, items }));
}

import { describe, expect, it } from 'vitest';
import { groupOptions } from './group-options';

describe('groupOptions', () => {
  it('keeps ungrouped options together under no heading', () => {
    expect(
      groupOptions([
        { value: 'en', label: 'English' },
        { value: 'sk', label: 'Slovak' },
      ]),
    ).toEqual([
      {
        heading: undefined,
        items: [
          { value: 'en', label: 'English' },
          { value: 'sk', label: 'Slovak' },
        ],
      },
    ]);
  });

  it('gathers options by group, in first-seen order', () => {
    const groups = groupOptions([
      { value: 'sk', label: 'Slovenčina', group: 'Slavic' },
      { value: 'en', label: 'English', group: 'Germanic' },
      { value: 'cs', label: 'Čeština', group: 'Slavic' },
    ]);

    expect(groups.map((group) => group.heading)).toEqual(['Slavic', 'Germanic']);
    expect(groups[0]?.items.map((option) => option.value)).toEqual(['sk', 'cs']);
  });

  it('answers nothing for no options', () => {
    expect(groupOptions([])).toEqual([]);
  });
});

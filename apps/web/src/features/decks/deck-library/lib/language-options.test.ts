import { describe, expect, it } from 'vitest';
import { CARD_LANGUAGE_CODES, languageOptions } from './language-options';

describe('languageOptions', () => {
  it('offers every supported code once', () => {
    expect(
      languageOptions('en')
        .map((option) => option.code)
        .sort(),
    ).toEqual([...CARD_LANGUAGE_CODES].sort());
  });

  it('names languages in the UI language', () => {
    expect(languageOptions('sk').find((option) => option.code === 'de')?.label).toBe('nemčina');
  });
});

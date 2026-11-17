/** Card languages offered in the create form. Any BCP 47 code is valid; these are the common ones. */
export const CARD_LANGUAGE_CODES = [
  'en',
  'es',
  'de',
  'fr',
  'it',
  'pt',
  'sk',
  'cs',
  'pl',
  'uk',
  'ja',
  'zh',
  'ko',
] as const;

/** One option of the language picker. */
export type LanguageOption = { code: string; label: string };

/**
 * Names each card language in the reader's own UI language, so no
 * translation keys are needed for language names.
 * @param uiLocale - the current UI locale
 * @returns options sorted by their localised label
 */
export function languageOptions(uiLocale: string): LanguageOption[] {
  const names = new Intl.DisplayNames([uiLocale], { type: 'language' });
  return CARD_LANGUAGE_CODES.map((code) => ({ code, label: names.of(code) ?? code })).sort(
    (first, second) => first.label.localeCompare(second.label, uiLocale),
  );
}

/** What a progress bar announces: the attributes Radix derives from `value`. */
export type ProgressAttributes = {
  'aria-valuemin': number;
  'aria-valuemax': number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'data-state': 'indeterminate' | 'loading' | 'complete';
  'data-value'?: number;
  'data-max': number;
};

/**
 * shadcn's Progress keeps `value` for its indicator and never hands it to
 * Radix, so the bar would always read as indeterminate to assistive
 * technology. Callers spread these attributes onto it to say how far along
 * it is, as Radix itself would.
 * @param value - how far along, from 0 to `max`; `null` or `undefined` while unknown
 * @param max - the value that means done
 * @returns the ARIA and data attributes for the progress bar
 */
export function progressAttributes(
  value: number | null | undefined,
  max = 100,
): ProgressAttributes {
  if (value === null || value === undefined) {
    return {
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'data-state': 'indeterminate',
      'data-max': max,
    };
  }
  const percent = Math.round((value / max) * 100);
  return {
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-valuenow': value,
    'aria-valuetext': `${percent}%`,
    'data-state': value >= max ? 'complete' : 'loading',
    'data-value': value,
    'data-max': max,
  };
}

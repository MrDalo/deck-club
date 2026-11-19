'use client';

import { useCallback, useState } from 'react';

type ControllableStateOptions<T> = {
  /** The controlled value; `undefined` leaves the component uncontrolled. */
  value: T | undefined;
  /** The starting value when uncontrolled. */
  defaultValue: T;
  /** Called with every new value, controlled or not. */
  onChange?: ((next: T) => void) | undefined;
};

/**
 * State that a parent may control (`value` + `onChange`) or leave to the
 * component (`defaultValue`), like a native input. Use `null`, not
 * `undefined`, for a controlled empty value.
 * @param options - the value, the default and the change handler
 * @returns the current value and its setter
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = value !== undefined;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [isControlled ? value : uncontrolled, setValue];
}

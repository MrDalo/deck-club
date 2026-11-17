'use client';

import { useTranslations } from 'next-intl';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { validationMessageKey } from './validation-message';

type FieldErrorProps = {
  /** The react-hook-form error for this field, if any. */
  error: HookFormFieldError | undefined;
  /** Element id, referenced by the input's aria-describedby. */
  id: string;
};

/** Translated, screen-reader-announced validation message under a field. */
export function FieldError({ error, id }: FieldErrorProps): React.JSX.Element | null {
  const t = useTranslations('validation');
  if (error === undefined) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-semibold text-[#9b1c41]">
      {t(validationMessageKey(error.type))}
    </p>
  );
}

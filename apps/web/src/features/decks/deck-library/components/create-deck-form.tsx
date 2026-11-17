'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { FieldError } from '@/shared/ui/field-error';
import { Form } from '@/shared/ui/form';
import { Input, Label, Select, Textarea } from '@/shared/ui/text-field';
import { useCreateDeckForm } from '../hooks/use-create-deck-form';
import { languageOptions } from '../lib/language-options';

/** New-deck form: title, card language, optional description. */
export function CreateDeckForm(): React.JSX.Element {
  const t = useTranslations('decks.create');
  const locale = useLocale();
  const { form, submit, isPending, error } = useCreateDeckForm();
  const { errors } = form.formState;

  return (
    <section
      aria-labelledby="create-deck-title"
      className="ruled rounded-[var(--radius-card)] border-2 border-ink p-5 pt-3 shadow-sticker"
    >
      <h2 id="create-deck-title" className="h-10 text-xl font-bold">
        {t('title')}
      </h2>
      <Form onSubmit={(event) => void submit(event)} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="deck-title">{t('titleLabel')}</Label>
          <Input
            id="deck-title"
            placeholder={t('titlePlaceholder')}
            aria-invalid={errors.title !== undefined}
            aria-describedby="deck-title-error"
            {...form.register('title')}
          />
          <FieldError id="deck-title-error" error={errors.title} />
        </div>
        <div>
          <Label htmlFor="deck-language">{t('languageLabel')}</Label>
          <Select id="deck-language" {...form.register('language')}>
            {languageOptions(locale).map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="deck-description">{t('descriptionLabel')}</Label>
          <Textarea
            id="deck-description"
            rows={2}
            aria-invalid={errors.description !== undefined}
            aria-describedby="deck-description-hint deck-description-error"
            {...form.register('description')}
          />
          <p id="deck-description-hint" className="mt-1 text-sm text-ink-soft">
            {t('descriptionHint')}
          </p>
          <FieldError id="deck-description-error" error={errors.description} />
        </div>
        {error !== null && <ErrorNotice message={t('failed')} error={error} />}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </Form>
    </section>
  );
}

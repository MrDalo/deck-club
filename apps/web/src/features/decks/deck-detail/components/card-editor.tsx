'use client';

import { CARD_TYPES } from '@deck-club/contracts';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { FieldError } from '@/shared/ui/field-error';
import { Form } from '@/shared/ui/form';
import { Input, Label, Select, Textarea } from '@/shared/ui/text-field';
import { type CardEditorState, useCardEditor } from '../hooks/use-card-editor';
import { CardPreview } from './card-preview';

/** Keyboard-first editor for adding cards one after another, with a live preview. */
export function CardEditor({ deckId }: { deckId: string }): React.JSX.Element {
  const t = useTranslations('decks.editor');
  const { form, submit, isPending, error, addedCount } = useCardEditor(deckId);
  const [front = '', back = ''] = form.watch(['front', 'back']);

  return (
    <section
      aria-labelledby="card-editor-title"
      className="rounded-[var(--radius-card)] border-2 border-ink bg-sky/35 p-5 shadow-sticker"
    >
      <h2 id="card-editor-title" className="text-2xl font-bold">
        {t('title')}
      </h2>
      <p id="card-editor-hint" className="mt-1 text-sm text-ink-soft">
        {t('hint')}
      </p>
      <Form
        onSubmit={(event) => void submit(event)}
        aria-describedby="card-editor-hint"
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <CardEditorFields form={form} />
        <div className="md:col-span-2">
          <CardPreview front={front} back={back} />
        </div>
        {error !== null && (
          <div className="md:col-span-2">
            <ErrorNotice message={t('failed')} error={error} />
          </div>
        )}
        <div className="flex items-center gap-4 md:col-span-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? t('submitting') : t('submit')}
          </Button>
          <p role="status" className="text-sm font-semibold">
            {addedCount > 0 && t('added')}
          </p>
        </div>
      </Form>
    </section>
  );
}

/** The four inputs, in keyboard order: front, back (Tab), type, extra. */
function CardEditorFields({ form }: { form: CardEditorState['form'] }): React.JSX.Element {
  const t = useTranslations('decks.editor');
  const { errors } = form.formState;
  return (
    <>
      <div>
        <Label htmlFor="card-front">{t('frontLabel')}</Label>
        <Input
          id="card-front"
          autoComplete="off"
          aria-invalid={errors.front !== undefined}
          aria-describedby="card-front-error"
          {...form.register('front')}
        />
        <FieldError id="card-front-error" error={errors.front} />
      </div>
      <div>
        <Label htmlFor="card-back">{t('backLabel')}</Label>
        <Input
          id="card-back"
          autoComplete="off"
          aria-invalid={errors.back !== undefined}
          aria-describedby="card-back-error"
          {...form.register('back')}
        />
        <FieldError id="card-back-error" error={errors.back} />
      </div>
      <div>
        <Label htmlFor="card-type">{t('typeLabel')}</Label>
        <Select id="card-type" {...form.register('type')}>
          {CARD_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="card-extra">{t('extraLabel')}</Label>
        <Textarea
          id="card-extra"
          rows={1}
          className="min-h-11"
          aria-invalid={errors.extra !== undefined}
          aria-describedby="card-extra-hint card-extra-error"
          {...form.register('extra')}
        />
        <p id="card-extra-hint" className="mt-1 text-sm text-ink-soft">
          {t('extraHint')}
        </p>
        <FieldError id="card-extra-error" error={errors.extra} />
      </div>
    </>
  );
}

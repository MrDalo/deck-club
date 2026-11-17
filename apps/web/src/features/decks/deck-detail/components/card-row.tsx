'use client';

import type { Card } from '@deck-club/contracts';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { ErrorNotice } from '@/shared/ui/error-notice';
import { FieldError } from '@/shared/ui/field-error';
import { Form } from '@/shared/ui/form';
import { Input, Label } from '@/shared/ui/text-field';
import { useCardEditForm } from '../hooks/use-card-edit-form';
import { type CardRowState, useCardRow } from '../hooks/use-card-row';

/** One card in the deck's list: read view with badges, or the inline edit form. */
export function CardRow({ card }: { card: Card }): React.JSX.Element {
  const row = useCardRow(card);
  return (
    <li className="rounded-2xl border-2 border-ink/80 bg-card p-4">
      {row.isEditing ? (
        <CardEditView card={card} row={row} />
      ) : (
        <CardReadView card={card} row={row} />
      )}
    </li>
  );
}

function CardReadView({ card, row }: { card: Card; row: CardRowState }): React.JSX.Element {
  const t = useTranslations('decks.card');
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
      <p className="font-semibold break-words whitespace-pre-wrap">{card.front}</p>
      <p className="break-words whitespace-pre-wrap text-ink-soft">{card.back}</p>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {card.type === 'reversible' && (
          <span className="rounded-full bg-sky px-2.5 py-0.5 text-xs font-semibold">
            {t('reversible')}
          </span>
        )}
        {card.provenance.clientName !== null && (
          <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold">
            {t('addedBy', { client: card.provenance.clientName })}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('editLabel', { front: card.front })}
          onClick={row.startEditing}
        >
          {t('edit')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t('deleteLabel', { front: card.front })}
          disabled={row.isRemoving}
          onClick={row.remove}
        >
          {t('delete')}
        </Button>
      </div>
      {row.removeError !== null && (
        <div className="sm:col-span-3">
          <ErrorNotice message={t('deleteFailed')} error={row.removeError} />
        </div>
      )}
    </div>
  );
}

function CardEditView({ card, row }: { card: Card; row: CardRowState }): React.JSX.Element {
  const t = useTranslations('decks');
  const { form, submit } = useCardEditForm(card, row.save);
  const { errors } = form.formState;
  const frontId = `edit-front-${card.id}`;
  const backId = `edit-back-${card.id}`;

  return (
    <Form onSubmit={(event) => void submit(event)} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={frontId}>{t('editor.frontLabel')}</Label>
        <Input
          id={frontId}
          aria-invalid={errors.front !== undefined}
          aria-describedby={`${frontId}-error`}
          {...form.register('front')}
        />
        <FieldError id={`${frontId}-error`} error={errors.front} />
      </div>
      <div>
        <Label htmlFor={backId}>{t('editor.backLabel')}</Label>
        <Input
          id={backId}
          aria-invalid={errors.back !== undefined}
          aria-describedby={`${backId}-error`}
          {...form.register('back')}
        />
        <FieldError id={`${backId}-error`} error={errors.back} />
      </div>
      {row.saveError !== null && (
        <div className="sm:col-span-2">
          <ErrorNotice message={t('card.saveFailed')} error={row.saveError} />
        </div>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" disabled={row.isSaving}>
          {t('card.save')}
        </Button>
        <Button variant="secondary" size="sm" onClick={row.stopEditing}>
          {t('card.cancel')}
        </Button>
      </div>
    </Form>
  );
}

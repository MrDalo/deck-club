'use client';

import {
  type Card,
  type UpdateCardCommand,
  type UpdateCardInput,
  UpdateCardInputSchema,
} from '@deck-club/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';

/**
 * The inline edit form of one card, validated by the contracts patch schema.
 * @param card - the card being edited; its text pre-fills the form
 * @param onSave - receives the validated patch
 * @returns the form and its submit handler
 */
export function useCardEditForm(
  card: Card,
  onSave: (patch: UpdateCardCommand) => void,
): {
  form: UseFormReturn<UpdateCardInput, unknown, UpdateCardCommand>;
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
} {
  const form = useForm<UpdateCardInput, unknown, UpdateCardCommand>({
    resolver: zodResolver(UpdateCardInputSchema),
    defaultValues: { front: card.front, back: card.back },
  });
  return { form, submit: form.handleSubmit(onSave) };
}

'use client';

import {
  type Card,
  CardSchema,
  type CreateCardCommand,
  type CreateCardInput,
  CreateCardInputSchema,
} from '@deck-club/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { apiRequest } from '@/shared/api/api-client';
import { queryKeys } from '@/shared/api/query-keys';

/** The fast card editor's form and submission state. */
export type CardEditorState = {
  form: UseFormReturn<CreateCardInput, unknown, CreateCardCommand>;
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isPending: boolean;
  error: unknown;
  /** How many cards this editor has added; announced after each one. */
  addedCount: number;
};

/**
 * Keyboard-first card entry (product spec 4.2): Enter adds the card, the
 * form clears but keeps the card type, and focus returns to the front.
 * @param deckId - the deck to add cards to
 * @returns form state and handlers
 */
export function useCardEditor(deckId: string): CardEditorState {
  const queryClient = useQueryClient();
  const [addedCount, setAddedCount] = useState(0);
  const form = useForm<CreateCardInput, unknown, CreateCardCommand>({
    resolver: zodResolver(CreateCardInputSchema),
    defaultValues: { type: 'basic', front: '', back: '', extra: '' },
  });
  const mutation = useMutation({
    mutationFn: (command: CreateCardCommand) =>
      apiRequest(`/decks/${deckId}/cards`, CardSchema, { method: 'POST', body: command }),
    onSuccess: async (card: Card) => {
      form.reset({ type: card.type, front: '', back: '', extra: '' });
      setAddedCount((count) => count + 1);
      await queryClient.invalidateQueries({ queryKey: queryKeys.deck(deckId) });
    },
  });

  // After each added card, focus goes back to the front for the next one (after the reset has rendered).
  useEffect(() => {
    if (addedCount > 0) form.setFocus('front');
  }, [addedCount, form]);

  const submit = form.handleSubmit(async (command) => {
    await mutation.mutateAsync(command).catch(() => undefined);
  });

  return { form, submit, isPending: mutation.isPending, error: mutation.error, addedCount };
}

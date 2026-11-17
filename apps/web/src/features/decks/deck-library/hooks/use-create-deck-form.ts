'use client';

import {
  type CreateDeckCommand,
  type CreateDeckInput,
  CreateDeckInputSchema,
  type Deck,
  DeckSchema,
} from '@deck-club/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useRouter } from '@/i18n/navigation';
import { apiRequest } from '@/shared/api/api-client';
import { queryKeys } from '@/shared/api/query-keys';

/** The create-deck form and its submission state. */
export type CreateDeckFormState = {
  form: UseFormReturn<CreateDeckInput, unknown, CreateDeckCommand>;
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isPending: boolean;
  error: unknown;
};

/**
 * Creates a deck from the contracts-validated form, refreshes the library
 * and opens the new deck so the user can add cards straight away.
 * @returns form state and handlers
 */
export function useCreateDeckForm(): CreateDeckFormState {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<CreateDeckInput, unknown, CreateDeckCommand>({
    resolver: zodResolver(CreateDeckInputSchema),
    defaultValues: { title: '', description: '', language: 'en' },
  });
  const mutation = useMutation({
    mutationFn: (command: CreateDeckCommand) =>
      apiRequest('/decks', DeckSchema, { method: 'POST', body: command }),
    onSuccess: async (deck: Deck) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks() });
      router.push(`/decks/${deck.id}`);
    },
  });

  const submit = form.handleSubmit(async (command) => {
    await mutation.mutateAsync(command).catch(() => undefined);
  });

  return { form, submit, isPending: mutation.isPending, error: mutation.error };
}

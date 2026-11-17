'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/i18n/navigation';
import { apiCommand } from '@/shared/api/api-client';
import { queryKeys } from '@/shared/api/query-keys';

/**
 * Soft-deletes a deck after the user confirms, then returns to the library.
 * @param deckId - the deck to delete
 * @returns `remove(confirmation)`, which does nothing unless the user confirms, plus mutation state
 */
export function useDeleteDeck(deckId: string): {
  remove: (confirmation: string) => void;
  isPending: boolean;
  error: unknown;
} {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => apiCommand(`/decks/${deckId}`, { method: 'DELETE' }),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: queryKeys.deck(deckId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.decks() });
      router.push('/decks');
    },
  });

  const remove = (confirmation: string): void => {
    if (window.confirm(confirmation)) mutation.mutate();
  };

  return { remove, isPending: mutation.isPending, error: mutation.error };
}

'use client';

import { type Card, CardSchema, type UpdateCardInput } from '@deck-club/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiCommand, apiRequest } from '@/shared/api/api-client';
import { queryKeys } from '@/shared/api/query-keys';

/** One card row's edit and delete state. */
export type CardRowState = {
  isEditing: boolean;
  startEditing: () => void;
  stopEditing: () => void;
  save: (patch: UpdateCardInput) => void;
  remove: () => void;
  isSaving: boolean;
  isRemoving: boolean;
  saveError: unknown;
  removeError: unknown;
};

/**
 * Inline edit and soft delete for one card. Both refresh the deck (its
 * count) and its card list through the nested query keys.
 * @param card - the card the row shows
 * @returns row state and handlers
 */
export function useCardRow(card: Card): CardRowState {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const refreshDeck = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.deck(card.deckId) });
  const cardPath = `/decks/${card.deckId}/cards/${card.id}`;

  const saveMutation = useMutation({
    mutationFn: (patch: UpdateCardInput) =>
      apiRequest(cardPath, CardSchema, { method: 'PATCH', body: patch }),
    onSuccess: async () => {
      setIsEditing(false);
      await refreshDeck();
    },
  });
  const removeMutation = useMutation({
    mutationFn: () => apiCommand(cardPath, { method: 'DELETE' }),
    onSuccess: refreshDeck,
  });

  return {
    isEditing,
    startEditing: () => setIsEditing(true),
    stopEditing: () => setIsEditing(false),
    save: (patch) => saveMutation.mutate(patch),
    remove: () => removeMutation.mutate(),
    isSaving: saveMutation.isPending,
    isRemoving: removeMutation.isPending,
    saveError: saveMutation.error,
    removeError: removeMutation.error,
  };
}

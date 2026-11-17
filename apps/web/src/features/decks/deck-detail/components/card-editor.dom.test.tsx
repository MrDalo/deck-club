import type { Card } from '@deck-club/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import messages from '../../../../../messages/en.json';
import { CardEditor } from './card-editor';

const deckId = '00000000-0000-4000-8000-000000000001';

const createdCard = (front: string, back: string): Card => ({
  id: '00000000-0000-4000-8000-000000000002',
  deckId,
  type: 'basic',
  front,
  back,
  extra: '',
  tags: [],
  provenance: { source: 'app', clientName: null },
  createdAt: '2026-11-17T10:00:00.000Z',
  updatedAt: '2026-11-17T10:00:00.000Z',
});

function renderEditor(): void {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <CardEditor deckId={deckId} />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CardEditor', () => {
  it('adds a card with Tab and Enter, then clears and refocuses the front', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(Response.json(createdCard('hablar', 'to speak'), { status: 201 })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText('Front'), 'hablar');
    await user.tab();
    await user.type(screen.getByLabelText('Back'), 'to speak{Enter}');

    await waitFor(() => expect(screen.getByLabelText('Front')).toHaveValue(''));
    expect(screen.getByLabelText('Front')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Card added.');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`/api/v1/decks/${deckId}/cards`);
    expect(JSON.parse(init.body as string)).toMatchObject({
      type: 'basic',
      front: 'hablar',
      back: 'to speak',
    });
  });

  it('shows the translated required message and sends nothing for an empty card', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add card' }));

    expect(await screen.findAllByText('Fill in this field.')).toHaveLength(2);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects HTML with the plain-text message from the contracts schema', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText('Front'), '<b>bold</b>');
    await user.type(screen.getByLabelText('Back'), 'x{Enter}');

    expect(
      await screen.findByText('Use plain text: HTML tags are not allowed.'),
    ).toBeInTheDocument();
  });

  it('previews the card while typing', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();
    renderEditor();

    await user.type(screen.getByLabelText('Front'), 'comer');

    expect(screen.getByRole('figure', { name: 'Preview' })).toHaveTextContent('comer');
  });
});

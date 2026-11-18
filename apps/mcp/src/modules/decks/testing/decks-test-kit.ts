import { loadEnv } from '../../../config/env.js';
import { DecksService } from '../application/decks.service.js';
import { FakeDecksApi } from './fake-decks-api.js';

/** The web app's public URL in tests; every deck link is built from it. */
const TEST_WEB_URL = 'https://deck.club';

/**
 * A {@link DecksService} over an in-memory API.
 * @param api - the fake API, by default an empty library
 * @returns the service and the fake it talks to
 */
export function createDecksService(api = new FakeDecksApi()): {
  decks: DecksService;
  api: FakeDecksApi;
} {
  const env = loadEnv({
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    WEB_PUBLIC_URL: TEST_WEB_URL,
  });
  return { decks: new DecksService(api, env), api };
}

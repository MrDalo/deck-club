import { loadEnv } from '../../../config/env.js';
import { ClubsService } from '../application/clubs.service.js';
import { FakeClubsApi } from './fake-clubs-api.js';

/** The web app's public URL in tests; every deck link is built from it. */
const TEST_WEB_URL = 'https://deck.club';

/**
 * A {@link ClubsService} over an in-memory API.
 * @param api - the fake API, by default a user in no club
 * @returns the service and the fake it talks to
 */
export function createClubsService(api = new FakeClubsApi()): {
  clubs: ClubsService;
  api: FakeClubsApi;
} {
  const env = loadEnv({
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    WEB_PUBLIC_URL: TEST_WEB_URL,
  });
  return { clubs: new ClubsService(api, env), api };
}

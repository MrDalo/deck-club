import { loadEnv } from '../../../config/env.js';
import { StudyService } from '../application/study.service.js';
import { FakeStudyApi } from './fake-study-api.js';

/** The web app's public URL in tests; every deck link is built from it. */
const TEST_WEB_URL = 'https://deck.club';

/**
 * A {@link StudyService} over an in-memory API.
 * @param api - the fake API, by default nothing due and no decks
 * @returns the service and the fake it talks to
 */
export function createStudyService(api = new FakeStudyApi()): {
  study: StudyService;
  api: FakeStudyApi;
} {
  const env = loadEnv({
    SUPABASE_URL: 'https://test-project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    WEB_PUBLIC_URL: TEST_WEB_URL,
  });
  return { study: new StudyService(api, env), api };
}

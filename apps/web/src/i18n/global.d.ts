import type messages from '../../messages/en.json';
import type { routing } from './routing';

/** Type-safe message keys and locales: a typo in t('…') fails the typecheck. */
declare module 'next-intl' {
  // next-intl's augmentation point is an interface.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}

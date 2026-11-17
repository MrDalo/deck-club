import 'reflect-metadata';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
} from '../src/common/auth/access-token-verifier.js';
import { ProblemDetailsFilter } from '../src/common/errors/problem-details.filter.js';
import { ENV, loadEnv } from '../src/config/env.js';
import { DATABASE, openDatabase } from '../src/infra/database/database.js';

/** Tokens the fake verifier accepts: `token-<userId>` signs in as `<userId>`. */
const fakeVerifier: AccessTokenVerifier = {
  verify: (token) =>
    Promise.resolve(token.startsWith('token-') ? { id: token.slice('token-'.length) } : null),
};

/**
 * The real AppModule over a fresh in-memory SQLite database (migrations
 * applied) and a fake token verifier, served through Fastify's inject.
 */
export async function createTestApp(): Promise<NestFastifyApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ENV)
    .useValue(
      loadEnv({
        SUPABASE_URL: 'https://test.supabase.co',
        DATABASE_URL: ':memory:',
        GIT_SHA: 'test',
      }),
    )
    .overrideProvider(DATABASE)
    .useFactory({ factory: () => openDatabase(':memory:') })
    .overrideProvider(ACCESS_TOKEN_VERIFIER)
    .useValue(fakeVerifier)
    .compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
    logger: false,
  });
  app.useGlobalFilters(new ProblemDetailsFilter());
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

/** Authorization header for a test user. */
export const signedInAs = (userId: string): { authorization: string } => ({
  authorization: `Bearer token-${userId}`,
});

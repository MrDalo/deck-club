import 'reflect-metadata';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/errors/problem-details.filter.js';
import { loadEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = new ConsoleLogger('api', { json: env.LOG_FORMAT === 'json' });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 1_048_576 }),
    {
      logger,
    },
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();

  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  logger.log({ evt: 'process.started', port: env.API_PORT });
}

bootstrap().catch((error: unknown) => {
  new Logger('api').fatal({
    evt: 'process.crashed',
    reason: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

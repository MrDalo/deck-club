import 'reflect-metadata';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = new ConsoleLogger('mcp', { json: env.LOG_FORMAT === 'json' });

  // 4 MB: an add_cards call carries up to 100 cards of up to 6 KB each.
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 4_194_304 }),
    { logger },
  );
  app.enableShutdownHooks();

  await app.listen({ port: env.MCP_PORT, host: '0.0.0.0' });
  logger.log({
    evt: 'process.started',
    port: env.MCP_PORT,
    resource: env.MCP_PUBLIC_URL,
    api: env.API_INTERNAL_URL,
  });
}

bootstrap().catch((error: unknown) => {
  new Logger('mcp').fatal({
    evt: 'process.crashed',
    reason: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

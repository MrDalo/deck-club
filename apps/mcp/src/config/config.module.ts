import { Global, Module } from '@nestjs/common';
import { ENV, loadEnv } from './env.js';

/** Provides the validated {@link ENV} to every module. Tests override the token. */
@Global()
@Module({
  providers: [{ provide: ENV, useFactory: () => loadEnv() }],
  exports: [ENV],
})
export class ConfigModule {}

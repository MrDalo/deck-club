import { Global, Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { DATABASE, openDatabase } from './database.js';

/** Opens and migrates the database once at boot and shares the handle with every module's adapters. */
@Global()
@Module({
  providers: [
    { provide: DATABASE, inject: [ENV], useFactory: (env: Env) => openDatabase(env.DATABASE_URL) },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}

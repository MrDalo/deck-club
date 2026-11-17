import { randomUUID } from 'node:crypto';

/** Port: the current time. Never read `new Date()` in a use case; inject this (rule 20-backend). */
export type Clock = {
  now(): Date;
};

/** Port: new entity ids. Seeded in tests so assertions can name ids. */
export type IdGenerator = {
  next(): string;
};

export const CLOCK = Symbol('CLOCK');
export const ID_GENERATOR = Symbol('ID_GENERATOR');

export const systemClock: Clock = { now: () => new Date() };
export const randomIds: IdGenerator = { next: () => randomUUID() };

/** The clock and id generator together, for use cases that stamp and name what they create. */
export type TimeAndIds = {
  clock: Clock;
  ids: IdGenerator;
};

export const TIME_AND_IDS = Symbol('TIME_AND_IDS');

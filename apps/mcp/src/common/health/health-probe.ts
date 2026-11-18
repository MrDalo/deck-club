import { DiscoveryService } from '@nestjs/core';

/**
 * One dependency the service needs to do useful work (the core API, the
 * authorization server). The health module discovers every provider marked
 * with {@link HealthCheck} and runs them for `GET /health/ready`.
 */
export type HealthProbe = {
  /** Short, stable name shown in the readiness report, e.g. `api`. */
  readonly name: string;
  /**
   * Resolves when the dependency answers as expected. The readiness service
   * bounds it with a timeout.
   * @throws DeckClubError whose detail is a short reason safe to publish
   */
  check(): Promise<void>;
};

/** Marks a provider as a {@link HealthProbe}. */
export const HealthCheck = DiscoveryService.createDecorator();

/**
 * Type guard for discovered instances.
 * @param value - a discovered provider instance
 * @returns whether it is a health probe
 */
export function isHealthProbe(value: unknown): value is HealthProbe {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'check' in value &&
    typeof value.check === 'function'
  );
}

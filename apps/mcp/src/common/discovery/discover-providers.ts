import type { DiscoverableDecorator, DiscoveryService } from '@nestjs/core';

/**
 * Finds every instantiated provider marked with a discoverable decorator.
 * Call it once the application has bootstrapped, when instances exist.
 * @param discovery - Nest's discovery service
 * @param decorator - the marker decorator
 * @param guard - checks an instance really has the expected shape
 * @returns the matching instances, in module registration order
 */
export function discoverProviders<Contributor>(
  discovery: DiscoveryService,
  decorator: DiscoverableDecorator<unknown>,
  guard: (value: unknown) => value is Contributor,
): Contributor[] {
  return discovery
    .getProviders({ metadataKey: decorator.KEY })
    .map((wrapper): unknown => wrapper.instance)
    .filter(guard);
}

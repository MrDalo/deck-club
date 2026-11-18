import type { DependencyCheck, Readiness } from '@deck-club/contracts';
import { DeckClubError } from '../../../common/errors/deck-club-error.js';
import type { HealthProbe } from '../../../common/health/health-probe.js';

/** Longest a single dependency may take before it counts as down. */
const PROBE_TIMEOUT_MS = 3_000;

/** Where the probes come from; the Nest adapter discovers them at runtime. */
export type ProbeSource = {
  list(): readonly HealthProbe[];
};

/** What the report says about this process. */
export type ServiceIdentity = {
  service: string;
  version: string;
};

class ProbeTimeout extends Error {}

function withTimeout(work: Promise<void>, timeoutMs: number): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new ProbeTimeout()), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

/** A short, fixed reason: never an exception message, which could hold a URL or secret. */
function reasonOf(error: unknown): string {
  if (error instanceof ProbeTimeout) return 'timed out';
  if (error instanceof DeckClubError) return error.detail;
  return 'check failed';
}

/**
 * Readiness (spec 11, observability): runs every dependency probe in
 * parallel, each bounded by a timeout, and reports ready only when all pass.
 */
export class ReadinessService {
  /**
   * @param probes - the dependency probes
   * @param identity - service name and deployed version
   * @param now - a monotonic clock in milliseconds, injectable for tests
   * @param timeoutMs - per-probe timeout
   */
  constructor(
    private readonly probes: ProbeSource,
    private readonly identity: ServiceIdentity,
    private readonly now: () => number = () => performance.now(),
    private readonly timeoutMs: number = PROBE_TIMEOUT_MS,
  ) {}

  /** @returns the readiness report, `ready` only when every dependency is up */
  async report(): Promise<Readiness> {
    const checks = await Promise.all(this.probes.list().map((probe) => this.run(probe)));
    const ready = checks.every((check) => check.status === 'up');
    return { status: ready ? 'ready' : 'not_ready', ...this.identity, checks };
  }

  private async run(probe: HealthProbe): Promise<DependencyCheck> {
    const startedAt = this.now();
    const latency = (): number => Math.max(0, Math.round(this.now() - startedAt));
    try {
      await withTimeout(probe.check(), this.timeoutMs);
      return { name: probe.name, status: 'up', latencyMs: latency() };
    } catch (error) {
      return { name: probe.name, status: 'down', latencyMs: latency(), detail: reasonOf(error) };
    }
  }
}

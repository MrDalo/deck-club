import { type ProblemDetails, ProblemDetailsSchema } from '@deck-club/contracts';
import type { ZodType } from 'zod';

/** Browser-side base path of the BFF route that forwards to the core API with the session token. */
const API_BASE_PATH = '/api/v1';

/** A failed API call. `problem` is the RFC 9457 body, or a synthetic one for network failures. */
export class ApiError extends Error {
  constructor(readonly problem: ProblemDetails) {
    super(`${problem.code}: ${problem.detail}`);
    this.name = 'ApiError';
  }

  /** Server faults and outages may succeed on retry; a refusal (4xx) never will. */
  get isTransient(): boolean {
    return this.problem.status >= 500;
  }
}

const unreachable = (): ApiError =>
  new ApiError({
    type: 'about:blank',
    title: 'UPSTREAM_UNAVAILABLE',
    status: 503,
    code: 'UPSTREAM_UNAVAILABLE',
    detail: 'Deck Club is not reachable.',
    traceId: '',
  });

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function send(path: string, options: RequestOptions): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method: options.method ?? 'GET',
      ...(options.body !== undefined && {
        body: JSON.stringify(options.body),
        headers: { 'content-type': 'application/json' },
      }),
    });
  } catch {
    throw unreachable();
  }
  if (response.ok) return response;
  const problem = ProblemDetailsSchema.safeParse(await response.json().catch(() => null));
  throw problem.success ? new ApiError(problem.data) : unreachable();
}

/**
 * Calls the core API and parses the response with its contracts schema.
 * @param path - path below /api/v1, e.g. `/decks`
 * @param schema - the contracts schema of the success body
 * @param options - method and JSON body
 * @returns the parsed body
 * @throws ApiError with the problem details on any failure
 */
export async function apiRequest<Output>(
  path: string,
  schema: ZodType<Output>,
  options: RequestOptions = {},
): Promise<Output> {
  const response = await send(path, options);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw unreachable();
  return parsed.data;
}

/**
 * Calls an endpoint that answers 204 No Content.
 * @param path - path below /api/v1
 * @param options - method and JSON body
 */
export async function apiCommand(path: string, options: RequestOptions): Promise<void> {
  await send(path, options);
}

/**
 * TanStack Query retry policy (rule 30-web): retry transient failures twice, never a refusal.
 * @param failureCount - how many attempts have failed so far
 * @param error - the last error
 * @returns whether to try again
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && !error.isTransient) return false;
  return failureCount < 2;
}

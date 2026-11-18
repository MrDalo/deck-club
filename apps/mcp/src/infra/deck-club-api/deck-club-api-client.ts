import {
  CLIENT_NAME_HEADER,
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENT_REPLAYED_HEADER,
  ProblemDetailsSchema,
} from '@deck-club/contracts';
import type { ZodType } from 'zod';
import { DeckClubError } from '../../common/errors/deck-club-error.js';
import type { FetchFunction } from '../../common/http/fetch-function.js';

/** Outbound timeout to the core API (rule 20-backend: no infinite waits). */
const DEFAULT_TIMEOUT_MS = 10_000;

/** Whose behalf a call is made on: the user's own token and the AI client's display name. */
export type ApiCredentials = {
  accessToken: string;
  clientName: string;
};

/** One call to the core API. The response body is parsed with `schema`, a contracts schema. */
export type ApiRequest<Output> = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Absolute path on the API, e.g. `/decks`. Encode path parameters before building it. */
  path: string;
  schema: ZodType<Output>;
  query?: Readonly<Record<string, string | number | undefined>>;
  body?: unknown;
  /** Omitted only for public endpoints such as `/health`. */
  credentials?: ApiCredentials;
  timeoutMs?: number;
};

/** A write that is safe to retry: sent with the AI's idempotency key, when it gave one. */
export type IdempotentApiRequest<Output> = ApiRequest<Output> & {
  /** Sent as `Idempotency-Key`; omitted, the write runs as usual. */
  idempotencyKey?: string | undefined;
};

/** The answer to an idempotent write. */
export type IdempotentApiResponse<Output> = {
  body: Output;
  /** True when the API answered a retry with the first request's response and wrote nothing. */
  replayed: boolean;
};

/**
 * Turns an API error body into a {@link DeckClubError}.
 * @param payload - the parsed response body, possibly not problem details
 * @param status - the HTTP status, used when the body is not problem details
 * @returns the refusal to throw
 */
export function toApiError(payload: unknown, status: number): DeckClubError {
  const problem = ProblemDetailsSchema.safeParse(payload);
  if (problem.success)
    return new DeckClubError(problem.data.code, problem.data.detail, problem.data.issues ?? []);
  if (status >= 500)
    return new DeckClubError(
      'UPSTREAM_UNAVAILABLE',
      'Deck Club is not answering right now. Try again in a minute.',
    );
  return new DeckClubError('INTERNAL', 'Deck Club returned an unexpected error.');
}

/**
 * The MCP server's only way to reach data (ADR 0004): the core REST API over
 * the private network, always with the user's own bearer token and the AI
 * client's name for provenance. The MCP server holds no data and no rules;
 * every refusal comes from the API as RFC 9457 problem details.
 */
export class DeckClubApiClient {
  /**
   * @param baseUrl - API_INTERNAL_URL, e.g. http://api:4000
   * @param fetchFunction - the HTTP client, global fetch in production
   */
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFunction: FetchFunction = (input, init) => fetch(input, init),
  ) {}

  /**
   * Sends one request and returns the contract-checked body.
   * @param request - what to call and how to read the answer
   * @returns the parsed response body
   * @throws DeckClubError with the API's code, UPSTREAM_UNAVAILABLE when the API cannot be reached, or INTERNAL when the answer breaks the contract
   */
  async send<Output>(request: ApiRequest<Output>): Promise<Output> {
    const response = await this.exchange(request);
    return this.read(request, response);
  }

  /**
   * Sends a write with the AI's idempotency key (ADR 0009), so a retried
   * tool call never writes twice: the API answers a retry with the first
   * request's response.
   * @param request - the write, and the key when the AI gave one
   * @returns the parsed response body, and whether it was a replay
   * @throws DeckClubError as {@link DeckClubApiClient.send}, including IDEMPOTENCY_KEY_REUSED and IDEMPOTENCY_KEY_IN_USE
   */
  async sendIdempotent<Output>(
    request: IdempotentApiRequest<Output>,
  ): Promise<IdempotentApiResponse<Output>> {
    const response = await this.exchange(request);
    return {
      body: await this.read(request, response),
      replayed: response.headers.get(IDEMPOTENT_REPLAYED_HEADER) === 'true',
    };
  }

  private async read<Output>(request: ApiRequest<Output>, response: Response): Promise<Output> {
    const payload: unknown =
      response.status === 204 ? undefined : await response.json().catch(() => null);
    if (!response.ok) throw toApiError(payload, response.status);
    const parsed = request.schema.safeParse(payload);
    if (!parsed.success)
      throw new DeckClubError('INTERNAL', 'Deck Club returned an unexpected response.');
    return parsed.data;
  }

  private async exchange(request: IdempotentApiRequest<unknown>): Promise<Response> {
    const hasBody = request.body !== undefined;
    try {
      return await this.fetchFunction(this.urlFor(request), {
        method: request.method,
        headers: {
          accept: 'application/json',
          ...(request.credentials !== undefined && {
            authorization: `Bearer ${request.credentials.accessToken}`,
            [CLIENT_NAME_HEADER]: request.credentials.clientName,
          }),
          ...(request.idempotencyKey !== undefined && {
            [IDEMPOTENCY_KEY_HEADER]: request.idempotencyKey,
          }),
          ...(hasBody && { 'content-type': 'application/json' }),
        },
        ...(hasBody && { body: JSON.stringify(request.body) }),
        signal: AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      });
    } catch {
      throw new DeckClubError(
        'UPSTREAM_UNAVAILABLE',
        'Deck Club is not reachable right now. Try again in a minute.',
      );
    }
  }

  private urlFor(request: ApiRequest<unknown>): URL {
    const url = new URL(request.path, this.baseUrl);
    for (const [name, value] of Object.entries(request.query ?? {}))
      if (value !== undefined) url.searchParams.set(name, String(value));
    return url;
  }
}

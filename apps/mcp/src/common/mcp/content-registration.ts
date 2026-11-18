import type { McpPromptName } from '@deck-club/contracts';
import {
  type GetPromptResult,
  type McpServer,
  type PromptCallback,
  ProtocolError,
  ProtocolErrorCode,
  type ReadResourceResult,
  ResourceTemplate,
  type StandardSchemaWithJSON,
  type Variables,
} from '@modelcontextprotocol/server';
import { Logger } from '@nestjs/common';
import { DeckClubError, describeRefusal } from '../errors/deck-club-error.js';

/** The text body of a resource. */
export type ResourceBody = {
  text: string;
  mimeType: string;
};

/** A resource as the AI client lists it. */
export type ResourceSpec = {
  /** Stable programmatic name. */
  name: string;
  /** A fixed URI, or an RFC 6570 template such as `deck-club://decks/{deckId}`. */
  uri: string;
  title: string;
  description: string;
  mimeType: string;
};

/** One message of a prompt; prompts here are plain text. */
export type PromptMessageText = {
  role: 'user' | 'assistant';
  text: string;
};

/** A prompt as the user picks it in their assistant (spec 9, prompts). */
export type PromptSpec<Schema extends StandardSchemaWithJSON> = {
  name: McpPromptName;
  title: string;
  description: string;
  argsSchema: Schema;
};

const logger = new Logger('mcp.content');

/**
 * Resources and prompts have no in-band error result, unlike tools, so a
 * refusal becomes a JSON-RPC error whose message still reads
 * `REJECTED: <CODE>. <detail>`. An unexpected error is logged and reported
 * without its message.
 * @param error - what the use case threw
 * @returns the protocol error to throw
 */
export function toProtocolError(error: unknown): ProtocolError {
  if (error instanceof DeckClubError) {
    const code =
      error.code === 'VALIDATION_FAILED'
        ? ProtocolErrorCode.InvalidParams
        : ProtocolErrorCode.InternalError;
    return new ProtocolError(code, describeRefusal(error), { code: error.code });
  }
  logger.error({
    evt: 'mcp.content.failed',
    reason: error instanceof Error ? error.name : 'unknown',
  });
  return new ProtocolError(
    ProtocolErrorCode.InternalError,
    'REJECTED: INTERNAL. Something went wrong.',
  );
}

async function guarded<Result>(work: () => Promise<Result>): Promise<Result> {
  try {
    return await work();
  } catch (error) {
    throw toProtocolError(error);
  }
}

const firstValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

/**
 * Flattens RFC 6570 template variables to one string each.
 * @param variables - the SDK's matched variables
 * @returns each variable's first value
 */
export function flattenVariables(variables: Variables): Record<string, string> {
  return Object.fromEntries(
    Object.entries(variables).map(([key, value]) => [key, firstValue(value)]),
  );
}

const contents = (uri: URL, body: ResourceBody): ReadResourceResult => ({
  contents: [{ uri: uri.href, mimeType: body.mimeType, text: body.text }],
});

/**
 * Registers a resource with a fixed URI.
 * @param server - the per-request MCP server
 * @param spec - the resource as clients list it
 * @param read - returns the body
 */
export function registerResource(
  server: McpServer,
  spec: ResourceSpec,
  read: () => Promise<ResourceBody>,
): void {
  server.registerResource(
    spec.name,
    spec.uri,
    { title: spec.title, description: spec.description, mimeType: spec.mimeType },
    async (uri) => contents(uri, await guarded(read)),
  );
}

/**
 * Registers a resource template such as `deck-club://decks/{deckId}`. It has
 * no list callback: the AI discovers concrete URIs through the tools.
 * @param server - the per-request MCP server
 * @param spec - the template as clients list it
 * @param read - returns the body for the matched variables
 */
export function registerResourceTemplate(
  server: McpServer,
  spec: ResourceSpec,
  read: (variables: Record<string, string>) => Promise<ResourceBody>,
): void {
  server.registerResource(
    spec.name,
    new ResourceTemplate(spec.uri, { list: undefined }),
    { title: spec.title, description: spec.description, mimeType: spec.mimeType },
    async (uri, variables) => contents(uri, await guarded(() => read(flattenVariables(variables)))),
  );
}

/**
 * Registers a prompt.
 * @param server - the per-request MCP server
 * @param spec - the prompt as the user picks it
 * @param build - returns the prompt messages for the validated arguments
 */
export function registerPrompt<Schema extends StandardSchemaWithJSON>(
  server: McpServer,
  spec: PromptSpec<Schema>,
  build: (args: StandardSchemaWithJSON.InferOutput<Schema>) => Promise<PromptMessageText[]>,
): void {
  // Same conditional-type limitation as tools; the runtime shape is exactly this.
  const callback = (async (
    args: StandardSchemaWithJSON.InferOutput<Schema>,
  ): Promise<GetPromptResult> => {
    const messages = await guarded(() => build(args));
    return {
      description: spec.description,
      messages: messages.map((message) => ({
        role: message.role,
        content: { type: 'text', text: message.text },
      })),
    };
  }) as PromptCallback<Schema>;
  server.registerPrompt(
    spec.name,
    { title: spec.title, description: spec.description, argsSchema: spec.argsSchema },
    callback,
  );
}

import { MCP_TOOL_SCOPES, type McpScope, type McpToolName } from '@deck-club/contracts';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import type {
  CallToolResult,
  McpServer,
  StandardSchemaWithJSON,
  ToolAnnotations,
  ToolCallback,
} from '@modelcontextprotocol/server';
import { Logger } from '@nestjs/common';
import { DeckClubError, describeRefusal } from '../errors/deck-club-error.js';
import type { McpCaller } from './mcp-caller.js';
import type { WidgetUri } from './widgets.js';

/** What a use case hands back on success: text for the model, data for its view. */
export type ToolReply = {
  text: string;
  /** Validated against the tool's `outputSchema` and handed to its MCP Apps view. */
  structuredContent?: Record<string, unknown>;
};

/** A tool as the AI sees it. Descriptions are written for the AI (spec 9, behavior rules). */
export type ToolSpec<Schema extends StandardSchemaWithJSON> = {
  name: McpToolName;
  title: string;
  description: string;
  inputSchema: Schema;
  /** The shape of `structuredContent`; declare it when the tool has a view. */
  outputSchema?: StandardSchemaWithJSON;
  annotations: ToolAnnotations;
  /** The MCP Apps view that renders this tool's result, when it has one. */
  widgetUri?: WidgetUri;
};

const logger = new Logger('mcp.tools');

/**
 * Formats a refusal as a tool result rather than a protocol error, so the AI
 * reads the reason and can tell the user (spec 9: short message plus code).
 * @param error - the refusal
 * @returns an `isError` tool result reading `REJECTED: <CODE>. <detail>`
 */
export function refusal(error: DeckClubError): CallToolResult {
  return {
    content: [{ type: 'text', text: describeRefusal(error) }],
    isError: true,
  };
}

const missingScope = (scope: McpScope): DeckClubError =>
  new DeckClubError(
    'FORBIDDEN',
    `This AI connection was not granted the "${scope}" scope. The user can grant it in Deck Club under Settings, AI connections.`,
  );

/**
 * Runs one tool call: checks the scope, runs the use case, turns every
 * outcome into a tool result, and records the call. Logs carry the tool, the
 * user and the outcome, never arguments, card content or the token (spec 11:
 * no card content in logs). An unexpected error is reported as INTERNAL,
 * never with its message, which may hold internals.
 * @param caller - who is calling
 * @param tool - the tool being called, for the log line
 * @param scope - the scope the tool needs
 * @param work - the use case
 * @returns the tool result
 */
export async function runTool(
  caller: McpCaller,
  tool: McpToolName,
  scope: McpScope,
  work: () => Promise<ToolReply>,
): Promise<CallToolResult> {
  const startedAt = Date.now();
  const record = (outcome: string, code?: string): void => {
    logger.log({
      evt: 'mcp.tool.called',
      tool,
      outcome,
      ...(code !== undefined && { code }),
      user: caller.userId,
      client: caller.clientName,
      durationMs: Date.now() - startedAt,
    });
  };

  if (!caller.scopes.includes(scope)) {
    record('refused', 'FORBIDDEN');
    return refusal(missingScope(scope));
  }
  try {
    const reply = await work();
    record('ok');
    return {
      content: [{ type: 'text', text: reply.text }],
      ...(reply.structuredContent !== undefined && { structuredContent: reply.structuredContent }),
    };
  } catch (error) {
    if (error instanceof DeckClubError) {
      record('refused', error.code);
      return refusal(error);
    }
    record('failed');
    logger.error({
      evt: 'mcp.tool.failed',
      tool,
      reason: error instanceof Error ? error.name : 'unknown',
    });
    return refusal(new DeckClubError('INTERNAL', 'Something went wrong in Deck Club. Try again.'));
  }
}

/**
 * Registers a Deck Club tool on a per-request server: scope from the
 * contracts catalogue, refusals as tool results, and the MCP Apps view link
 * when the tool has one.
 * @param server - the per-request MCP server
 * @param caller - the caller the server is bound to
 * @param spec - the tool as the AI sees it
 * @param run - the use case, called with the validated input
 */
export function registerTool<Schema extends StandardSchemaWithJSON>(
  server: McpServer,
  caller: McpCaller,
  spec: ToolSpec<Schema>,
  run: (input: StandardSchemaWithJSON.InferOutput<Schema>) => Promise<ToolReply>,
): void {
  const scope = MCP_TOOL_SCOPES[spec.name];
  const config = {
    title: spec.title,
    description: spec.description,
    inputSchema: spec.inputSchema,
    ...(spec.outputSchema !== undefined && { outputSchema: spec.outputSchema }),
    annotations: { title: spec.title, openWorldHint: false, ...spec.annotations },
  };
  // The SDK types the callback through a conditional type that TypeScript
  // cannot resolve for a generic Schema; the runtime shape is exactly this.
  const callback = (async (input: StandardSchemaWithJSON.InferOutput<Schema>) =>
    runTool(caller, spec.name, scope, () => run(input))) as ToolCallback<Schema>;
  if (spec.widgetUri === undefined) {
    server.registerTool(spec.name, config, callback);
    return;
  }
  registerAppTool(
    server,
    spec.name,
    { ...config, _meta: { ui: { resourceUri: spec.widgetUri } } },
    callback,
  );
}

import type { ZodType } from 'zod';

/** The parts of a tool result a view reads. */
export type ToolResultLike = {
  isError?: boolean | undefined;
  structuredContent?: unknown;
};

/**
 * Reads the structured output of a tool result a view fetched itself
 * (through the host), with the tool's contracts schema.
 * @param schema - the tool's output schema
 * @param result - the tool result the host relayed
 * @returns the data, or null when the tool refused or the result breaks the contract
 */
export function readToolOutput<Output>(
  schema: ZodType<Output>,
  result: ToolResultLike,
): Output | null {
  if (result.isError === true) return null;
  const parsed = schema.safeParse(result.structuredContent);
  return parsed.success ? parsed.data : null;
}

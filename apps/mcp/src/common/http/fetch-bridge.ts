import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Builds the web-standard `Request` the MCP SDK's HTTP handler and auth
 * helpers take. The JSON body is not copied: Fastify has parsed it already
 * and the handler receives it as `parsedBody`. Fastify sends the SDK's web
 * `Response` back as is (`reply.send(response)`).
 * @param request - the Fastify request
 * @param signal - aborts the MCP exchange when the client goes away
 * @returns a body-less web request with the same method, URL and headers
 */
export function toWebRequest(request: FastifyRequest, signal?: AbortSignal): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  const url = new URL(
    request.url,
    `${request.protocol}://${request.host === '' ? 'localhost' : request.host}`,
  );
  return new Request(url, {
    method: request.method,
    headers,
    ...(signal !== undefined && { signal }),
  });
}

/**
 * An abort signal that fires when the client disconnects before the reply
 * finished, so an in-flight tool call stops instead of running for nobody.
 * @param reply - the Fastify reply
 * @returns the signal
 */
export function abortWhenClientLeaves(reply: FastifyReply): AbortSignal {
  const controller = new AbortController();
  reply.raw.on('close', () => {
    if (!reply.raw.writableFinished) controller.abort();
  });
  return controller.signal;
}

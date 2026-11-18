import { EventEmitter } from 'node:events';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it } from 'vitest';
import { abortWhenClientLeaves, toWebRequest } from './fetch-bridge.js';

function fastifyRequest(overrides: Partial<FastifyRequest>): FastifyRequest {
  return {
    method: 'POST',
    url: '/mcp?probe=1',
    protocol: 'http',
    host: 'localhost:4100',
    headers: {},
    ...overrides,
  } as FastifyRequest;
}

function fastifyReply(writableFinished: boolean): { reply: FastifyReply; raw: EventEmitter } {
  const raw = Object.assign(new EventEmitter(), { writableFinished });
  return { reply: { raw } as unknown as FastifyReply, raw };
}

describe('toWebRequest', () => {
  it('keeps the method, the full URL and the headers', () => {
    const request = toWebRequest(
      fastifyRequest({
        headers: { authorization: 'Bearer token-ana', 'mcp-protocol-version': '2026-07-28' },
      }),
    );

    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://localhost:4100/mcp?probe=1');
    expect(request.headers.get('authorization')).toBe('Bearer token-ana');
    expect(request.headers.get('mcp-protocol-version')).toBe('2026-07-28');
  });

  it('joins a repeated header into one value', () => {
    const request = toWebRequest(
      fastifyRequest({
        headers: {
          accept: ['application/json', 'text/event-stream'],
        } as unknown as FastifyRequest['headers'],
      }),
    );

    expect(request.headers.get('accept')).toBe('application/json, text/event-stream');
  });

  it('falls back to localhost when the request names no host', () => {
    expect(toWebRequest(fastifyRequest({ host: '' })).url).toBe('http://localhost/mcp?probe=1');
  });

  it('carries the abort signal', () => {
    const controller = new AbortController();

    const request = toWebRequest(fastifyRequest({}), controller.signal);
    controller.abort();

    expect(request.signal.aborted).toBe(true);
  });
});

describe('abortWhenClientLeaves', () => {
  it('aborts when the connection closes before the reply finished', () => {
    const { reply, raw } = fastifyReply(false);
    const signal = abortWhenClientLeaves(reply);

    raw.emit('close');

    expect(signal.aborted).toBe(true);
  });

  it('does not abort after a completed reply', () => {
    const { reply, raw } = fastifyReply(true);
    const signal = abortWhenClientLeaves(reply);

    raw.emit('close');

    expect(signal.aborted).toBe(false);
  });
});

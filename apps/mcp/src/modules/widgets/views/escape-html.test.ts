import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape-html.js';

describe('escapeHtml', () => {
  it('neutralises markup', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
  });

  it('escapes ampersands and apostrophes', () => {
    expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('leaves ordinary deck titles alone', () => {
    expect(escapeHtml('Spanish A1 verbs')).toBe('Spanish A1 verbs');
  });
});

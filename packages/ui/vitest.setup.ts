import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library unmounts between tests only when it finds a global
// `afterEach`; Vitest runs without globals, so it is registered here.
afterEach(cleanup);

// Browser APIs jsdom does not implement but shadcn/Radix primitives call:
// `matchMedia` (shadcn's use-mobile hook), `ResizeObserver` (Radix measures
// checkboxes, switches, sliders, popper content), pointer capture and
// `scrollIntoView` (Radix Select, cmdk), `scrollTo` (the message scroller), `IntersectionObserver` (embla, the
// carousel), `elementFromPoint` (input-otp). Inert stand-ins, installed only where the
// environment has no function of that name (Vitest can expose `undefined` keys).
const inert = (): undefined => undefined;
const isMissing = (owner: object, name: string): boolean =>
  typeof Reflect.get(owner, name) !== 'function';

if (isMissing(window, 'matchMedia')) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: inert,
      removeEventListener: inert,
      addListener: inert,
      removeListener: inert,
      dispatchEvent: () => false,
    }),
  });
}

if (isMissing(globalThis, 'ResizeObserver')) {
  globalThis.ResizeObserver = class InertResizeObserver {
    observe = inert;
    unobserve = inert;
    disconnect = inert;
  };
}

if (isMissing(globalThis, 'IntersectionObserver')) {
  globalThis.IntersectionObserver = class InertIntersectionObserver {
    readonly root = null;
    readonly rootMargin = '0px';
    readonly scrollMargin = '0px';
    readonly thresholds: readonly number[] = [];
    observe = inert;
    unobserve = inert;
    disconnect = inert;
    takeRecords = (): IntersectionObserverEntry[] => [];
  };
}

if (isMissing(document, 'elementFromPoint')) {
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null });
}

const ELEMENT_METHODS = {
  hasPointerCapture: () => false,
  setPointerCapture: inert,
  releasePointerCapture: inert,
  scrollIntoView: inert,
  scrollTo: inert,
};
for (const [name, value] of Object.entries(ELEMENT_METHODS))
  if (isMissing(Element.prototype, name))
    Object.defineProperty(Element.prototype, name, { configurable: true, value });

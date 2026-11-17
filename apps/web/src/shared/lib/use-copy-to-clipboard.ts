'use client';

import { useEffect, useState } from 'react';

/** How long the "Copied" confirmation stays visible. */
const CONFIRMATION_MS = 2000;

/**
 * Copies text and briefly reports success, for copy buttons.
 * @returns `copy(text)` resolving to whether it worked, and `hasCopied` while the confirmation shows
 */
export function useCopyToClipboard(): {
  copy: (text: string) => Promise<boolean>;
  hasCopied: boolean;
} {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!hasCopied) return undefined;
    const timer = setTimeout(() => setHasCopied(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [hasCopied]);

  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      return true;
    } catch {
      return false;
    }
  };

  return { copy, hasCopied };
}

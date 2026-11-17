'use client';

import { useState } from 'react';
import { useCopyToClipboard } from '@/shared/lib/use-copy-to-clipboard';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser-client';

/**
 * Copies the current session's access token for pasting into an AI client.
 * Temporary: replaced by the MCP OAuth flow, after which no token is shown.
 * @returns `copyToken`, the copied flag, and whether the session was missing
 */
export function useAccessTokenCopy(): {
  copyToken: () => Promise<void>;
  hasCopied: boolean;
  hasFailed: boolean;
} {
  const { copy, hasCopied } = useCopyToClipboard();
  const [hasFailed, setHasFailed] = useState(false);

  const copyToken = async (): Promise<void> => {
    const { data } = await createSupabaseBrowserClient().auth.getSession();
    const token = data.session?.access_token;
    setHasFailed(token === undefined || !(await copy(token)));
  };

  return { copyToken, hasCopied, hasFailed };
}

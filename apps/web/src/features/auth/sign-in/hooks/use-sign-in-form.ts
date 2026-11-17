'use client';

import { SignInInputSchema } from '@deck-club/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser-client';

type SignInFields = { email: string };

/** What the sign-in form needs: the form, the submit handler and where the link was sent. */
export type SignInFormState = {
  form: UseFormReturn<SignInFields>;
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  /** The address the link went to, once sent. */
  sentTo: string | null;
  hasFailed: boolean;
  startOver: () => void;
};

/**
 * Magic-link sign-in: validate with the contracts schema, ask Supabase to
 * email a one-time link that lands on /auth/callback.
 * @returns form state and handlers; `sentTo` switches the UI to "check your inbox"
 */
export function useSignInForm(): SignInFormState {
  const form = useForm<SignInFields>({
    resolver: zodResolver(SignInInputSchema),
    defaultValues: { email: '' },
  });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const submit = form.handleSubmit(async ({ email }) => {
    setHasFailed(false);
    const supabase = createSupabaseBrowserClient();
    const emailRedirectTo = new URL(
      '/auth/callback?next=/decks',
      window.location.origin,
    ).toString();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    if (error === null) setSentTo(email);
    else setHasFailed(true);
  });

  const startOver = (): void => {
    setSentTo(null);
    form.reset();
  };

  return { form, submit, sentTo, hasFailed, startOver };
}

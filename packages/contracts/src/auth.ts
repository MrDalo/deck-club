import { z } from 'zod';

/** The sign-in form: an email address for the magic link (product spec 10: no passwords). */
export const SignInInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});
export type SignInInput = z.input<typeof SignInInputSchema>;

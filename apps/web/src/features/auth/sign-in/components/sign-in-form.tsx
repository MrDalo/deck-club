'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { FieldError } from '@/shared/ui/field-error';
import { Form } from '@/shared/ui/form';
import { Input, Label } from '@/shared/ui/text-field';
import { useSignInForm } from '../hooks/use-sign-in-form';

type SignInFormProps = {
  /** True when the user arrived from an expired or reused magic link. */
  linkExpired: boolean;
};

/** Email field that sends a magic link, then a "check your inbox" state. */
export function SignInForm({ linkExpired }: SignInFormProps): React.JSX.Element {
  const t = useTranslations('auth');
  const { form, submit, sentTo, hasFailed, startOver } = useSignInForm();
  const { errors, isSubmitting } = form.formState;

  if (sentTo !== null) {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-card)] border-2 border-ink bg-mint/60 p-6 shadow-sticker"
      >
        <h2 className="text-2xl font-bold">{t('signIn.sentTitle')}</h2>
        <p className="mt-2">{t('signIn.sentLead', { email: sentTo })}</p>
        <Button variant="ghost" size="sm" className="mt-4 -ml-3" onClick={startOver}>
          {t('signIn.useAnother')}
        </Button>
      </div>
    );
  }

  return (
    <Form onSubmit={(event) => void submit(event)} className="space-y-4">
      {linkExpired && (
        <p role="alert" className="rounded-xl bg-peach/70 px-4 py-3 text-sm font-semibold">
          {t('callbackFailed')}
        </p>
      )}
      <div>
        <Label htmlFor="email">{t('signIn.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('signIn.emailPlaceholder')}
          aria-invalid={errors.email !== undefined}
          aria-describedby="email-error"
          {...form.register('email')}
        />
        <FieldError id="email-error" error={errors.email} />
      </div>
      {hasFailed && (
        <p role="alert" className="text-sm font-semibold text-[#9b1c41]">
          {t('signIn.failed')}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('signIn.sending') : t('signIn.submit')}
      </Button>
    </Form>
  );
}

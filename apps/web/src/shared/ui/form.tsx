import type { ComponentProps } from 'react';

/**
 * Every client-handled form renders through this. `method="post"` means a
 * submit pressed before hydration never puts field values in a GET URL;
 * `noValidate` leaves validation to the contracts schema (rule 30-web).
 */
export function Form(props: Omit<ComponentProps<'form'>, 'method' | 'action'>): React.JSX.Element {
  return <form method="post" noValidate {...props} />;
}

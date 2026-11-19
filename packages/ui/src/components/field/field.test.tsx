import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '#components/checkbox';
import { Input } from '#components/input';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '.';

describe('Field', () => {
  it('wires a label, a description and an error to the control', () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="title">Deck title</FieldLabel>
        <Input id="title" aria-invalid aria-describedby="title-help title-error" />
        <FieldDescription id="title-help">Shown on the deck tile.</FieldDescription>
        <FieldError id="title-error">Give the deck a title.</FieldError>
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Deck title' });

    expect(input).toHaveAccessibleDescription('Shown on the deck tile. Give the deck a title.');
    expect(screen.getByRole('alert')).toHaveTextContent('Give the deck a title.');
  });

  it('keeps the label Ink when invalid and puts the error in Danger', () => {
    render(
      <Field data-invalid>
        <FieldLabel>Deck title</FieldLabel>
        <FieldError>Give the deck a title.</FieldError>
      </Field>,
    );

    expect(screen.getByRole('group')).toHaveClass('data-[invalid=true]:text-ink');
    expect(screen.getByText('Deck title')).toHaveClass('text-ink');
    expect(screen.getByRole('alert')).toHaveClass('text-danger');
  });

  it('shows one error from react-hook-form style errors, or a list of several', () => {
    const { rerender } = render(
      <FieldError errors={[{ message: 'Too short.' }, { message: 'Too short.' }]} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/^Too short\.$/);

    rerender(<FieldError errors={[{ message: 'Too short.' }, { message: 'Use letters.' }]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows nothing without an error', () => {
    render(<FieldError errors={[]} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('groups fields under a legend', () => {
    render(
      <FieldSet>
        <FieldLegend>Study settings</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="limit">New cards a day</FieldLabel>
            <Input id="limit" />
          </Field>
        </FieldGroup>
      </FieldSet>,
    );
    expect(screen.getByRole('group', { name: 'Study settings' })).toContainElement(
      screen.getByRole('textbox', { name: 'New cards a day' }),
    );
  });

  it('makes a choice card that checks when clicked', async () => {
    const user = userEvent.setup();
    render(
      <FieldLabel htmlFor="ai">
        <Field orientation="horizontal">
          <Checkbox id="ai" aria-labelledby="ai-title" />
          <FieldContent>
            <FieldTitle id="ai-title">Let my AI add cards</FieldTitle>
          </FieldContent>
        </Field>
      </FieldLabel>,
    );

    await user.click(screen.getByText('Let my AI add cards'));
    expect(screen.getByRole('checkbox', { name: 'Let my AI add cards' })).toBeChecked();
  });
});

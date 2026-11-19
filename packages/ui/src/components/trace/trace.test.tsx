import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Trace, TraceStep } from '.';

const statusLabels = { pending: 'Waiting', running: 'In progress', done: 'Done', error: 'Failed' };

function Steps(): React.JSX.Element {
  return (
    <Trace label="What Claude did" statusLabels={statusLabels} locale="en">
      <TraceStep status="done" title="Read the deck" detail="48 cards" duration={820} />
      <TraceStep status="error" title="Fetched the syllabus" detail="The page did not load." />
      <TraceStep status="running" title="Writing new cards" />
      <TraceStep status="pending" title="Save to Biology 101" />
    </Trace>
  );
}

describe('Trace', () => {
  it('lists the steps in order under its translated name', () => {
    render(<Steps />);

    const list = screen.getByRole('list', { name: 'What Claude did' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('reads each step’s status out in words', () => {
    render(<Steps />);

    const [done, error, running, pending] = screen.getAllByRole('listitem');
    expect(done).toHaveTextContent('Done: Read the deck');
    expect(error).toHaveTextContent('Failed: Fetched the syllabus');
    expect(running).toHaveTextContent('In progress: Writing new cards');
    expect(pending).toHaveTextContent('Waiting: Save to Biology 101');
  });

  it('marks the step under way as the current one', () => {
    render(<Steps />);

    const steps = screen.getAllByRole('listitem');
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
    expect(steps.filter((step) => step.hasAttribute('aria-current'))).toHaveLength(1);
  });

  it('shows the detail and the duration in the Trace’s locale', () => {
    render(
      <Trace label="Import" statusLabels={statusLabels} locale="cs">
        <TraceStep status="done" title="Nahráno" detail="12 karet" duration={1400} />
      </Trace>,
    );

    expect(screen.getByText('12 karet')).toBeInTheDocument();
    expect(screen.getByText('1,4 s')).toBeInTheDocument();
  });

  it('renders extra content under a step', () => {
    render(
      <Trace label="Import" statusLabels={statusLabels}>
        <TraceStep status="done" title="Called create_cards">
          <pre>{'{ "count": 12 }'}</pre>
        </TraceStep>
      </Trace>,
    );

    expect(screen.getByText('{ "count": 12 }')).toBeInTheDocument();
  });

  it('refuses a step outside a Trace', () => {
    expect(() => render(<TraceStep status="done" title="Lost" />)).toThrow(
      'TraceStep must be used within a Trace.',
    );
  });
});

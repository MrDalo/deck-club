import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '#components/collapsible';
import { Trace, TraceStep, type TraceStatus } from '.';

const statusLabels = { pending: 'Waiting', running: 'In progress', done: 'Done', error: 'Failed' };

const meta = {
  title: 'Components/Trace',
  component: Trace,
  args: { label: 'What Claude did', statusLabels, locale: 'en', className: 'w-96' },
} satisfies Meta<typeof Trace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An AI assistant answering "Make me 12 cards from chapter 3". */
export const ToolCalls: Story = {
  render: (args) => (
    <Trace {...args}>
      <TraceStep
        status="done"
        title="Read your deck Biology 101"
        detail="48 cards"
        duration={820}
      />
      <TraceStep
        status="done"
        title="Read chapter 3: The cell cycle"
        detail="6 pages"
        duration={2400}
      />
      <TraceStep status="running" title="Writing 12 new cards" />
      <TraceStep status="pending" title="Add them to Biology 101" />
    </Trace>
  ),
};

export const Finished: Story = {
  render: (args) => (
    <Trace {...args}>
      <TraceStep status="done" title="Read your deck Biology 101" duration={820} />
      <TraceStep status="done" title="Wrote 12 new cards" duration={14_300} />
      <TraceStep status="done" title="Added them to Biology 101" duration={310} />
    </Trace>
  ),
};

export const WithAFailure: Story = {
  render: (args) => (
    <Trace {...args}>
      <TraceStep status="done" title="Read your deck Biology 101" duration={820} />
      <TraceStep
        status="error"
        title="Fetch the course syllabus"
        detail="The page did not answer. Nothing was changed."
        duration={125_000}
      />
      <TraceStep status="pending" title="Write new cards" />
    </Trace>
  ),
};

/** The tool's input and output, behind a Collapsible. */
export const WithDetails: Story = {
  render: (args) => (
    <Trace {...args}>
      <TraceStep status="done" title="Called create_cards" detail="12 cards" duration={1400}>
        <Collapsible>
          <CollapsibleTrigger className="-ml-3 text-sm">Show the request</CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 overflow-x-auto rounded-xl border-2 border-ink/80 bg-paper p-3 text-xs">
              {JSON.stringify({ deckId: 'bio-101', count: 12, chapter: 3 }, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </TraceStep>
      <TraceStep status="done" title="Added them to Biology 101" duration={310} />
    </Trace>
  ),
};

/** Every status side by side. */
export const Statuses: Story = {
  render: (args) => (
    <Trace {...args}>
      {(['pending', 'running', 'done', 'error'] as const satisfies TraceStatus[]).map((status) => (
        <TraceStep key={status} status={status} title={statusLabels[status]} />
      ))}
    </Trace>
  ),
};

/** Durations and status words in Czech. */
export const Czech: Story = {
  args: {
    label: 'Co Claude udělal',
    locale: 'cs',
    statusLabels: { pending: 'Čeká', running: 'Probíhá', done: 'Hotovo', error: 'Selhalo' },
  },
  render: (args) => (
    <Trace {...args}>
      <TraceStep status="done" title="Přečetl balíček Biologie 101" duration={1400} />
      <TraceStep status="running" title="Píše 12 nových karet" />
    </Trace>
  ),
};

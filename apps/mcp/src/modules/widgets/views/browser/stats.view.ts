import { type GetStatsOutput, GetStatsOutputSchema } from '@deck-club/contracts';
import { ASK_FOR_STATS } from '../chat-messages.js';
import { readStats, REFRESH_ACTION, renderStats, STATS_TOOL } from '../stats-markup.js';
import { callThroughHost, startView, type ViewContext } from './view-runtime.js';

/**
 * "Refresh": reads the stats again with `get_stats` through the host, e.g.
 * after a quiz, without a round trip through the model. A host that does
 * not relay tool calls from views gets the request as a chat message.
 */
async function refresh(_value: string, view: ViewContext<GetStatsOutput>): Promise<void> {
  const shown = view.current();
  if (shown === undefined) return;
  const result = await callThroughHost(
    view.app,
    { name: STATS_TOOL, arguments: {} },
    ASK_FOR_STATS,
  );
  if (result === null) return view.render(shown);
  const stats = readStats(result);
  if (stats === null) {
    view.notice('The stats could not be refreshed. Ask the assistant for them.');
    return;
  }
  view.render(stats);
}

/** The `get_stats` view: the streak, today's progress, retention and the cards the user keeps forgetting. */
startView<GetStatsOutput>({
  name: 'deck-club-stats',
  schema: GetStatsOutputSchema,
  render: renderStats,
  messages: {
    toolFailed: 'Deck Club could not load your stats. The assistant has the reason.',
    unreadable: 'Deck Club sent stats this view could not read. Ask again in a moment.',
  },
  actions: { [REFRESH_ACTION]: refresh },
});

import type { McpToolName } from '@deck-club/contracts';
import { App, PostMessageTransport } from '@modelcontextprotocol/ext-apps';
import type { ZodType } from 'zod';
import { FOCUS_ATTRIBUTE, notice, SEARCH_FIELD_NAME } from '../components.js';
import { hostActionFor } from '../host-actions.js';

/** The element every view renders into (see `widgetDocument`). */
const VIEW_ROOT_ID = 'deck-club-view';

/** What a view's own actions can do with the view. */
export type ViewContext<Data> = {
  /** The MCP Apps bridge to the host, e.g. to call a server tool. */
  readonly app: App;
  /** The data on screen, if any has arrived. */
  current(): Data | undefined;
  /** Shows new data. */
  render(data: Data): void;
  /** Keeps what is on screen and says what went wrong below it. */
  notice(message: string): void;
};

/** A view's own button action, e.g. "more": gets the button's `data-value`. */
type ViewAction<Data> = (value: string, view: ViewContext<Data>) => Promise<void>;

/** Everything a view is: its data contract, its markup and its own actions. */
export type ViewDefinition<Data> = {
  /** Identifies the view to the host. */
  name: string;
  /** The tool's output schema from contracts; the view renders nothing it could not parse. */
  schema: ZodType<Data>;
  render(data: Data): string;
  /** What to say when the tool refused, and when its result is unreadable. */
  messages: { toolFailed: string; unreadable: string };
  actions?: Readonly<Record<string, ViewAction<Data>>>;
};

const CONNECT_FAILED =
  'This view could not reach the chat app. Open Deck Club in your browser instead.';

/** A server tool call a view makes through the host. */
type ServerToolCall = { name: McpToolName; arguments: Record<string, unknown> };

/**
 * Calls a Deck Club tool through the host (MCP Apps `tools/call`), without a
 * round trip through the model. A host that does not relay tool calls from
 * views (no `serverTools` capability) gets `fallback` as a chat message in
 * the user's name instead, and the assistant takes it from there.
 * @param app - the view's bridge to the host
 * @param call - the tool and its arguments
 * @param fallback - what to ask the assistant when the host cannot relay
 * @returns the tool result, or null when the fallback was sent
 */
export async function callThroughHost(
  app: App,
  call: ServerToolCall,
  fallback: string,
): Promise<Awaited<ReturnType<App['callServerTool']>> | null> {
  if (app.getHostCapabilities()?.serverTools === undefined) {
    await app.sendMessage({ role: 'user', content: [{ type: 'text', text: fallback }] });
    return null;
  }
  return app.callServerTool(call);
}

/**
 * Starts a view inside the host's iframe: connects to the host, renders the
 * tool result it receives, and turns button presses and form submissions
 * into host requests. `open` and `ask` work in every view; anything else
 * goes to the view's own `actions`, with the control disabled while it runs
 * so it cannot be used twice. This is the only DOM code a view needs; its
 * markup stays pure.
 * @param view - the view
 */
export function startView<Data>(view: ViewDefinition<Data>): void {
  const app = new App({ name: view.name, version: '1.0.0' }, {}, { autoResize: true });
  const root = document.getElementById(VIEW_ROOT_ID);
  let shown: Data | undefined;

  // A redraw keeps what the user opened: a disclosure with an id (e.g. a
  // revealed answer) that is still there stays open.
  const show = (html: string): void => {
    if (root === null) return;
    const opened = [...root.querySelectorAll('details[open][id]')].map((element) => element.id);
    root.innerHTML = html;
    for (const id of opened) document.getElementById(id)?.setAttribute('open', '');
  };
  const context: ViewContext<Data> = {
    app,
    current: () => shown,
    render: (data) => {
      shown = data;
      show(view.render(data));
    },
    notice: (message) => show(`${shown === undefined ? '' : view.render(shown)}${notice(message)}`),
  };

  app.ontoolresult = (result) => {
    if (result.isError === true) return show(notice(view.messages.toolFailed));
    const parsed = view.schema.safeParse(result.structuredContent);
    if (!parsed.success) return show(notice(view.messages.unreadable));
    context.render(parsed.data);
  };

  const runAction = (name: string, value: string, control: HTMLButtonElement | null): void => {
    const handler = view.actions?.[name];
    if (handler === undefined) return;
    if (control !== null) {
      control.disabled = true;
      control.setAttribute('aria-busy', 'true');
    }
    handler(value, context)
      .then(() => {
        // The pressed control is gone with the redraw; focus goes where the view marked.
        root?.querySelector<HTMLElement>(`[${FOCUS_ATTRIBUTE}]`)?.focus();
      })
      .catch((error: unknown) => {
        console.error(`Deck Club view action "${name}" failed`, error);
        context.notice('That did not work. Try again in a moment.');
      });
  };

  root?.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest('button');
    if (button === null || button === undefined) return;
    const action = hostActionFor({ action: button.dataset.action, value: button.dataset.value });
    if (action.kind === 'open') void app.openLink({ url: action.url });
    if (action.kind === 'ask')
      void app.sendMessage({ role: 'user', content: [{ type: 'text', text: action.text }] });
    if (action.kind === 'custom') runAction(action.name, action.value, button);
  });

  root?.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement | null;
    const name = form?.dataset.action;
    if (form === null || name === undefined) return;
    event.preventDefault();
    const value = new FormData(form).get(SEARCH_FIELD_NAME);
    if (typeof value !== 'string' || value.trim() === '') return;
    runAction(name, value.trim(), form.querySelector('button[type="submit"]'));
  });

  app.connect(new PostMessageTransport(window.parent, window.parent)).catch((error: unknown) => {
    // The host's developer tools are the only place a view can report this.
    console.error('Deck Club view could not connect to the host', error);
    show(notice(CONNECT_FAILED));
  });
}

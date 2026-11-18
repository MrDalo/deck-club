/**
 * What a view asks for when the user presses one of its buttons. Every
 * button carries `data-action` and `data-value`; the view runtime turns them
 * into one of these.
 */
export type HostAction =
  /** Open a URL in the user's browser, through the host (`ui/open-link`). */
  | { kind: 'open'; url: string }
  /** Send a message to the assistant in the user's name (`ui/message`). */
  | { kind: 'ask'; text: string }
  /** Something only this view knows how to do, such as loading the next page. */
  | { kind: 'custom'; name: string; value: string }
  | { kind: 'none' };

/** The attributes a view's button carries. */
export type ButtonDataset = {
  action?: string | undefined;
  value?: string | undefined;
};

/**
 * Reads the action off the element the user pressed.
 * @param dataset - the element's `data-` attributes
 * @returns what to do
 */
export function hostActionFor(dataset: ButtonDataset): HostAction {
  const { action, value } = dataset;
  if (action === undefined || action === '' || value === undefined || value === '')
    return { kind: 'none' };
  if (action === 'open') return { kind: 'open', url: value };
  if (action === 'ask') return { kind: 'ask', text: value };
  return { kind: 'custom', name: action, value };
}

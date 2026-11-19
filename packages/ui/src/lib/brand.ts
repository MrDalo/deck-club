/**
 * Class recipes every branded component shares, so a focus ring, a sticker
 * surface or a menu item looks the same everywhere (brand/README.md). Plain
 * strings, so Tailwind sees every class.
 */

/** The six highlighter pastels. Fills only: text on them is Ink. */
export const PASTELS = ['lilac', 'mint', 'peach', 'rose', 'sky', 'butter'] as const;

/** One of the brand pastels. */
export type Pastel = (typeof PASTELS)[number];

/** Solid pastel fill per pastel. */
export const PASTEL_FILL: Record<Pastel, string> = {
  lilac: 'bg-lilac',
  mint: 'bg-mint',
  peach: 'bg-peach',
  rose: 'bg-rose',
  sky: 'bg-sky',
  butter: 'bg-butter',
};

/**
 * Keyboard focus: the brand's 3px Focus outline, offset 2px, in place of
 * shadcn's translucent ring (which falls under 3:1 against Paper).
 */
export const FOCUS_RING =
  'outline-none focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus focus-visible:outline-solid';

/** Floating surfaces: popovers, menus, dialogs. A sticker card. */
export const SURFACE = 'rounded-2xl border-2 border-ink bg-card text-ink shadow-sticker';

/** A row in a menu or list box; highlighted rows get the highlighter. */
export const MENU_ITEM =
  'gap-2 rounded-lg px-2.5 py-2 text-sm text-ink focus:bg-butter focus:text-ink data-[highlighted]:bg-butter data-[disabled]:opacity-50';

/** A destructive menu row: Danger text, a rose wash when highlighted. */
export const MENU_ITEM_DANGER =
  'data-[variant=destructive]:text-danger data-[variant=destructive]:focus:bg-rose/50 data-[variant=destructive]:focus:text-danger data-[variant=destructive]:*:[svg]:!text-danger';

/**
 * A form control's box (inputs, pickers, comboboxes), as the web app draws
 * its fields: Card fill, an Ink outline at 80%, Danger when invalid.
 */
export const FIELD =
  'flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border-2 border-ink/80 bg-card px-3.5 text-left text-base text-ink aria-invalid:border-danger aria-invalid:bg-rose/20 disabled:cursor-not-allowed disabled:opacity-50';

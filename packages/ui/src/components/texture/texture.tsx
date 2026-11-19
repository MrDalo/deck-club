import { Slot as SlotPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import type { Pastel } from '#lib/brand';
import { cn } from '#lib/utils';

/** The paper patterns of the brand (brand/README.md, theme.css utilities). */
export type TexturePattern = 'ruled' | 'lined' | 'grid' | 'dots';

/** The fill under the pattern: Paper, white Card or one of the pastels. */
export type TextureTone = 'paper' | 'card' | Pastel;

const PATTERN: Record<Exclude<TexturePattern, 'ruled'>, string> = {
  lined: 'lined-paper',
  grid: 'grid-paper',
  dots: 'dot-paper',
};

const TONE: Record<TextureTone, string> = {
  paper: 'bg-paper',
  card: 'bg-card',
  lilac: 'bg-lilac',
  mint: 'bg-mint',
  peach: 'bg-peach',
  rose: 'bg-rose',
  sky: 'bg-sky',
  butter: 'bg-butter',
};

type TextureOwnProps =
  | {
      /** A white ruled index card with the rose margin rule. Always on Card. */
      pattern: 'ruled';
      tone?: never;
    }
  | {
      /** Lined, squared (grid) or dotted notebook paper. Defaults to lined. */
      pattern?: Exclude<TexturePattern, 'ruled'>;
      /** The fill under the pattern. Defaults to Card. */
      tone?: TextureTone;
    };

export type TextureProps = Omit<ComponentProps<'div'>, 'children'> &
  TextureOwnProps & {
    /** Render the pattern onto the single child element instead of a div. */
    asChild?: boolean;
    children?: React.ReactNode;
  };

/**
 * A paper surface: ruled index card, lined, squared or dotted notebook
 * paper, on Card, Paper or a pastel. Purely decorative (a background), so
 * whatever sits on it keeps its own semantics; text on it is Ink.
 */
export function Texture({
  pattern = 'lined',
  tone,
  asChild = false,
  className,
  ...props
}: TextureProps): React.JSX.Element {
  const Comp = asChild ? SlotPrimitive.Slot : 'div';

  return (
    <Comp
      data-slot="texture"
      data-pattern={pattern}
      className={cn(
        'text-ink',
        pattern === 'ruled' ? 'ruled' : [TONE[tone ?? 'card'], PATTERN[pattern]],
        className,
      )}
      {...props}
    />
  );
}

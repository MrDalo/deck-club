import type { Meta, StoryObj } from '@storybook/react-vite';
import { PASTELS } from '#lib/brand';
import { Texture, type TexturePattern, type TextureTone } from '.';

type StoryArgs = {
  pattern: Exclude<TexturePattern, 'ruled'>;
  tone: TextureTone;
};

const meta = {
  title: 'Components/Texture',
  args: { pattern: 'lined', tone: 'card' },
  argTypes: {
    pattern: { control: 'inline-radio', options: ['lined', 'grid', 'dots'] },
    tone: { control: 'select', options: ['card', 'paper', ...PASTELS] },
  },
  render: (args) => (
    <Texture
      pattern={args.pattern}
      tone={args.tone}
      className="grid h-48 w-80 place-items-center rounded-card border-2 border-ink shadow-sticker-sm"
    >
      <p className="font-display text-lg font-semibold">Mitosis, in four phases</p>
    </Texture>
  ),
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Lined: Story = {};
export const Grid: Story = { args: { pattern: 'grid' } };
export const Dots: Story = { args: { pattern: 'dots', tone: 'paper' } };

export const RuledIndexCard: Story = {
  render: () => (
    <Texture
      pattern="ruled"
      className="w-80 rounded-card border-2 border-ink p-5 pt-3 shadow-sticker"
    >
      <p className="font-display text-lg leading-8 font-semibold">Photosynthesis</p>
      <p className="mt-4 leading-8">
        Light energy becomes chemical energy stored in glucose, inside the chloroplasts.
      </p>
    </Texture>
  ),
};

export const AllPatterns: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {(['lined', 'grid', 'dots'] as const).map((pattern) => (
        <Texture
          key={pattern}
          pattern={pattern}
          className="grid h-32 w-48 place-items-center rounded-card border-2 border-ink"
        >
          <span className="font-semibold capitalize">{pattern}</span>
        </Texture>
      ))}
      <Texture
        pattern="ruled"
        className="grid h-32 w-48 place-items-center rounded-card border-2 border-ink"
      >
        <span className="font-semibold">Ruled</span>
      </Texture>
    </div>
  ),
};

export const OnPastels: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {PASTELS.map((tone) => (
        <Texture
          key={tone}
          pattern="grid"
          tone={tone}
          className="grid h-24 w-36 place-items-center rounded-card border-2 border-ink"
        >
          <span className="font-semibold capitalize">{tone}</span>
        </Texture>
      ))}
    </div>
  ),
};

/** On a page section: the pattern sits on the section itself. */
export const AsChild: Story = {
  render: () => (
    <Texture asChild pattern="dots" tone="paper">
      <section aria-label="Scratchpad" className="w-96 rounded-card border-2 border-ink p-6">
        <h2 className="font-display text-xl font-semibold">Scratchpad</h2>
        <p className="mt-2 text-ink-soft">Sketch the cell cycle before you flip the card.</p>
      </section>
    </Texture>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { AspectRatio } from '.';

/** An inline SVG, so the story needs no network. */
const PICTURE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="#c3e0fa"/><circle cx="80" cy="45" r="28" fill="#bdebd6" stroke="#24203a" stroke-width="3"/><circle cx="80" cy="45" r="9" fill="#cdbffb" stroke="#24203a" stroke-width="3"/></svg>',
)}`;

const meta = {
  title: 'Components/Aspect Ratio',
  component: AspectRatio,
  argTypes: {
    frame: { control: 'inline-radio', options: ['sticker', 'ruled', 'none'] },
    ratio: { control: { type: 'number', step: 0.1 } },
  },
  args: { ratio: 16 / 9 },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <AspectRatio {...args}>
      <img src={PICTURE} alt="A cell with its nucleus" />
    </AspectRatio>
  ),
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sticker: Story = {};
export const Square: Story = { args: { ratio: 1 } };
export const Portrait: Story = { args: { ratio: 3 / 4 } };
export const RuledPlaceholder: Story = {
  args: { frame: 'ruled', ratio: 3 / 2 },
  render: (args) => <AspectRatio {...args} />,
};
export const Frameless: Story = { args: { frame: 'none' } };

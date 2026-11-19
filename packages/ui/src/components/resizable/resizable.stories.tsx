import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '.';

const meta = {
  title: 'Components/Resizable',
  component: ResizablePanelGroup,
  args: { orientation: 'horizontal', variant: 'sticker', className: 'min-h-64 max-w-2xl' },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    variant: { control: 'inline-radio', options: ['sticker', 'plain'] },
  },
  render: (args) => (
    <ResizablePanelGroup {...args}>
      <ResizablePanel defaultSize="35%" minSize="20%">
        <div className="grid h-full content-start gap-2 p-4">
          <p className="font-display text-lg font-bold">Cards</p>
          <p className="text-ink-soft">Mitosis · Meiosis · Osmosis</p>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle label="Resize the card list" />
      <ResizablePanel>
        <div className="ruled h-full p-5 pt-12">
          <p className="font-display text-lg font-bold">Mitosis</p>
          <p>Cell division into two identical daughter cells.</p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};
export const Vertical: Story = {
  args: { orientation: 'vertical', className: 'min-h-96 max-w-md' },
};

export const ThreePanels: Story = {
  render: (args) => (
    <ResizablePanelGroup {...args}>
      <ResizablePanel defaultSize="25%">
        <p className="p-4 font-bold">Decks</p>
      </ResizablePanel>
      <ResizableHandle label="Resize the deck list" />
      <ResizablePanel defaultSize="40%">
        <p className="p-4 font-bold">Cards</p>
      </ResizablePanel>
      <ResizableHandle label="Resize the card list" withHandle />
      <ResizablePanel>
        <p className="p-4 font-bold">Editor</p>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

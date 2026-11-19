import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Attachment, type AttachmentProps } from '.';

/** Storybook cannot infer args from the remove-or-not union, so stories use a flat shape. */
type StoryArgs = Omit<AttachmentProps, 'onRemove' | 'removeLabel'> & {
  onRemove?: () => void;
  removeLabel?: string;
};

function renderAttachment({ onRemove, removeLabel, ...args }: StoryArgs): React.JSX.Element {
  return onRemove !== undefined && removeLabel !== undefined ? (
    <Attachment {...args} onRemove={onRemove} removeLabel={removeLabel} />
  ) : (
    <Attachment {...args} />
  );
}

const meta = {
  title: 'Components/Attachment',
  // The flat-args wrapper is the documented component: Attachment's own
  // remove-or-not union does not fit Storybook's args.
  component: renderAttachment,
  args: { name: 'Biology exam.apkg', size: 1_482_000, type: 'application/zip', locale: 'en' },
  argTypes: {
    status: { control: 'inline-radio', options: ['ready', 'uploading', 'error'] },
    variant: { control: 'inline-radio', options: ['row', 'chip'] },
    progress: { control: { type: 'range', min: 0, max: 100 } },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = {};
export const Uploading: Story = { args: { status: 'uploading', progress: 45 } };
export const Failed: Story = {
  args: { status: 'error', error: 'This file is not a Deck Club or Anki export.' },
};
export const Removable: Story = {
  args: { onRemove: fn(), removeLabel: 'Remove Biology exam.apkg' },
};
export const Linked: Story = {
  args: { name: 'Lecture notes.pdf', type: 'application/pdf', href: '#notes' },
};
export const Chip: Story = {
  args: {
    variant: 'chip',
    name: 'mitosis.png',
    type: 'image/png',
    onRemove: fn(),
    removeLabel: 'Remove mitosis.png',
  },
};
export const ChipUploading: Story = {
  args: {
    variant: 'chip',
    name: 'mitosis.png',
    type: 'image/png',
    status: 'uploading',
    progress: 70,
  },
};
export const Slovak: Story = { args: { locale: 'sk', size: 12_345_678 } };

export const FileKinds: Story = {
  render: () => (
    <div className="grid gap-3">
      <Attachment name="cards.csv" size={48_200} />
      <Attachment name="cell-diagram.png" size={312_000} />
      <Attachment name="Biology exam.apkg" size={1_482_000} />
      <Attachment name="notes.pdf" size={820_000} />
      <Attachment name="pronunciation.mp3" size={2_400_000} />
      <Attachment name="lab.mp4" size={24_000_000} />
      <Attachment name="README" size={900} />
    </div>
  ),
};

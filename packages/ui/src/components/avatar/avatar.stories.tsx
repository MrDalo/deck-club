import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, AvatarGroup } from '.';

const PORTRAIT = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#c3e0fa"/><circle cx="20" cy="16" r="7" fill="#ffd3b8" stroke="#24203a" stroke-width="2"/><path d="M6 40c2-9 8-13 14-13s12 4 14 13" fill="#cdbffb" stroke="#24203a" stroke-width="2"/></svg>',
)}`;

const MEMBERS = ['Jana Nováková', 'Peter Horváth', 'Eva Svobodová', 'Tomáš Dvořák', 'Claude'];

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { name: 'Jana Nováková' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    tone: {
      control: 'select',
      options: [undefined, 'lilac', 'mint', 'peach', 'rose', 'sky', 'butter'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const Picture: Story = { args: { src: PORTRAIT } };
export const BrokenPicture: Story = { args: { src: '/missing.png' } };

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-4">
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

export const StableTones: Story = {
  render: () => (
    <div className="flex gap-3">
      {MEMBERS.map((name) => (
        <Avatar key={name} name={name} size="lg" />
      ))}
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup aria-label="Biology club members">
      {MEMBERS.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>
  ),
};

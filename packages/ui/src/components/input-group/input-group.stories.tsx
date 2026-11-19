import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyIcon, SearchIcon, SendHorizontalIcon, XIcon } from 'lucide-react';
import { Kbd } from '#components/kbd';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from '.';

const meta = {
  title: 'Components/Input Group',
  component: InputGroup,
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchWithIcon: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Search cards" placeholder="Search cards" />
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <Kbd>/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Search cards" defaultValue="mitosis" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>12 results</InputGroupText>
        <InputGroupButton size="icon-xs" aria-label="Clear search">
          <XIcon aria-hidden />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Units: Story = {
  render: () => (
    <InputGroup className="max-w-56">
      <InputGroupInput aria-label="New cards a day" type="number" defaultValue={20} />
      <InputGroupAddon align="inline-end">
        <InputGroupText>a day</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const CopyLink: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput
        aria-label="Invite link"
        readOnly
        defaultValue="https://deck.club/join/biology-7f3a"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="sm">
          <CopyIcon aria-hidden />
          Copy
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Composer: Story = {
  render: () => (
    <InputGroup>
      <InputGroupTextarea
        aria-label="Ask your AI"
        placeholder="Make 10 cards about cell division…"
      />
      <InputGroupAddon align="block-end" className="border-t-2 border-line">
        <InputGroupText>Claude</InputGroupText>
        <InputGroupButton size="sm" className="ml-auto">
          Send
          <SendHorizontalIcon aria-hidden />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Invalid: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="New cards a day" aria-invalid defaultValue={-3} type="number" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>a day</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <InputGroup data-disabled="true">
      <InputGroupInput aria-label="Search cards" placeholder="Search cards" disabled />
      <InputGroupAddon>
        <SearchIcon aria-hidden />
      </InputGroupAddon>
    </InputGroup>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '.';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: { defaultValue: 'cards', className: 'max-w-md' },
  argTypes: { variant: { control: 'inline-radio', options: ['pills', 'underline'] } },
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Biology exam">
        <TabsTrigger value="cards">Cards</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="cards">42 cards, 12 due today.</TabsContent>
      <TabsContent value="stats">91% retention over the last 30 days.</TabsContent>
      <TabsContent value="settings">20 new cards a day.</TabsContent>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pills: Story = {};
export const Underline: Story = { args: { variant: 'underline' } };
export const DisabledTab: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Biology exam">
        <TabsTrigger value="cards">Cards</TabsTrigger>
        <TabsTrigger value="battles" disabled>
          Battles
        </TabsTrigger>
      </TabsList>
      <TabsContent value="cards">42 cards.</TabsContent>
    </Tabs>
  ),
};

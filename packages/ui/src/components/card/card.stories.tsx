import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '#components/badge';
import { Button } from '#components/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '.';

const meta = {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    variant: { control: 'inline-radio', options: ['sticker', 'raised', 'flat', 'ruled'] },
    accent: {
      control: 'select',
      options: [undefined, 'lilac', 'mint', 'peach', 'rose', 'sky', 'butter'],
    },
    interactive: { control: 'boolean' },
  },
  args: { className: 'w-80' },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Biology exam</CardTitle>
        <CardDescription>42 cards · 12 due today</CardDescription>
        <CardAction>
          <Badge tone="butter">12 due</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>Cells, genetics and evolution, for the exam on Friday.</CardContent>
      <CardFooter>
        <Button size="sm">Study now</Button>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sticker: Story = {};
export const Raised: Story = { args: { variant: 'raised' } };
export const Flat: Story = { args: { variant: 'flat' } };
export const Ruled: Story = {
  args: { variant: 'ruled' },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>What is mitosis?</CardTitle>
      </CardHeader>
      <CardContent className="pt-3 leading-8">
        Cell division that makes two identical daughter cells.
      </CardContent>
    </Card>
  ),
};
export const DeckTab: Story = { args: { accent: 'mint' } };
export const Interactive: Story = { args: { accent: 'sky', interactive: true } };

export const AllAccents: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {(['lilac', 'mint', 'peach', 'rose', 'sky', 'butter'] as const).map((accent) => (
        <Card key={accent} accent={accent} interactive className="w-48">
          <CardHeader>
            <CardTitle>{accent}</CardTitle>
            <CardDescription>12 cards</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  ),
};

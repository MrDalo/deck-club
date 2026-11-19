import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '#components/avatar';
import { Badge } from '#components/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '.';

const MEMBERS = [
  { name: 'Jana Nováková', reviews: 412, streak: 14, retention: '94%' },
  { name: 'Peter Horváth', reviews: 288, streak: 3, retention: '88%' },
  { name: 'Eva Svobodová', reviews: 96, streak: 2, retention: '81%' },
];

const meta = {
  title: 'Components/Table',
  component: Table,
  argTypes: { variant: { control: 'inline-radio', options: ['sticker', 'plain'] } },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Table {...args}>
      <TableCaption>Biology club, this week</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead className="text-right">Reviews</TableHead>
          <TableHead>Streak</TableHead>
          <TableHead className="text-right">Retention</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEMBERS.map((member) => (
          <TableRow key={member.name}>
            <TableCell>
              <span className="flex items-center gap-2 font-semibold">
                <Avatar name={member.name} size="sm" />
                {member.name}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">{member.reviews}</TableCell>
            <TableCell>
              <Badge tone={member.streak >= 7 ? 'mint' : 'paper'}>{member.streak} days</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{member.retention}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Club</TableCell>
          <TableCell className="text-right tabular-nums">796</TableCell>
          <TableCell />
          <TableCell className="text-right tabular-nums">90%</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sticker: Story = {};
export const Plain: Story = { args: { variant: 'plain' } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#components/button';
import { Field, FieldGroup, FieldLabel } from '#components/field';
import { Input } from '#components/input';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '.';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  argTypes: { defaultOpen: { control: 'boolean' } },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Form: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Rename deck</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close">
        <DialogHeader>
          <DialogTitle>Rename deck</DialogTitle>
          <DialogDescription>Give the deck a name you will recognise.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="deck-name">Name</FieldLabel>
            <Input id="deck-name" defaultValue="Biology exam" />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button>Save name</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Information: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="secondary">How does spaced repetition work?</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close">
        <DialogHeader>
          <DialogTitle>Spaced repetition</DialogTitle>
          <DialogDescription>
            Deck Club shows a card again just before you would forget it. Cards you know well come
            back rarely; cards you find hard come back soon.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button>Finish session</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Session done</DialogTitle>
          <DialogDescription>
            You reviewed 42 cards. Come back tomorrow for 18 more.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Back to decks</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Open: Story = { ...Form, args: { defaultOpen: true } };

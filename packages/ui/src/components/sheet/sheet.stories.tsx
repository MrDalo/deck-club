import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#components/button';
import { Field, FieldGroup, FieldLabel } from '#components/field';
import { Input } from '#components/input';
import { SwitchField } from '#components/switch';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '.';

function Settings({ side }: { side: 'top' | 'right' | 'bottom' | 'left' }): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary">Open from the {side}</Button>
      </SheetTrigger>
      <SheetContent side={side} closeLabel="Close">
        <SheetHeader>
          <SheetTitle>Deck settings</SheetTitle>
          <SheetDescription>How Biology exam is studied.</SheetDescription>
        </SheetHeader>
        <FieldGroup className="px-5">
          <Field>
            <FieldLabel htmlFor={`limit-${side}`}>New cards a day</FieldLabel>
            <Input id={`limit-${side}`} type="number" defaultValue={20} />
          </Field>
          <SwitchField label="Shuffle new cards" defaultChecked />
        </FieldGroup>
        <SheetFooter>
          <Button>Save settings</Button>
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = { render: () => <Settings side="right" /> };
export const Left: Story = { render: () => <Settings side="left" /> };
export const Bottom: Story = { render: () => <Settings side="bottom" /> };
export const Top: Story = { render: () => <Settings side="top" /> };
export const Open: Story = {
  render: () => (
    <Sheet defaultOpen>
      <SheetContent closeLabel="Close">
        <SheetHeader>
          <SheetTitle>Deck settings</SheetTitle>
          <SheetDescription>How Biology exam is studied.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

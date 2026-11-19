import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '#components/button';
import { toast, Toaster } from '.';

const meta = {
  title: 'Components/Toast',
  component: Toaster,
  args: { label: 'Notifications', closeLabel: 'Dismiss', position: 'bottom-right' },
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
    },
    closeButton: { control: 'boolean' },
  },
  render: (args) => (
    <>
      <Toaster {...args} />
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => toast('Deck renamed.')}>
          Plain
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.success('Card added.', { description: 'Biology exam has 43 cards.' })
          }
        >
          Success
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.error('Could not save the card.', {
              description: 'Check your connection and try again.',
            })
          }
        >
          Error
        </Button>
        <Button variant="secondary" onClick={() => toast.warning('3 new cards left for today.')}>
          Warning
        </Button>
        <Button variant="secondary" onClick={() => toast.info('Claude is adding 10 cards.')}>
          Info
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast('Card deleted.', {
              action: { label: 'Undo', onClick: () => toast.success('Card restored.') },
            })
          }
        >
          With action
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
              loading: 'Importing your deck…',
              success: 'Imported 42 cards.',
              error: 'Could not import the file.',
            })
          }
        >
          Loading
        </Button>
      </div>
    </>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kinds: Story = {};
export const WithCloseButton: Story = { args: { closeButton: true } };
export const TopCenter: Story = { args: { position: 'top-center' } };

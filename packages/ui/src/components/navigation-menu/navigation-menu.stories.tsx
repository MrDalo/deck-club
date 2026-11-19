import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BarChart3Icon,
  CalendarCheckIcon,
  LayersIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '.';

function PanelLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  text: string;
}): React.JSX.Element {
  return (
    <li>
      <NavigationMenuLink href={href} className="flex-row items-start gap-3">
        {icon}
        <span className="grid gap-0.5">
          <span className="font-semibold">{title}</span>
          <span className="text-ink-soft">{text}</span>
        </span>
      </NavigationMenuLink>
    </li>
  );
}

const meta = {
  title: 'Components/Navigation Menu',
  component: NavigationMenu,
  args: { 'aria-label': 'Main' },
  argTypes: { viewport: { control: 'boolean' } },
  decorators: [
    (Story) => (
      <div className="min-h-72">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <NavigationMenu {...args}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Study</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 gap-1">
              <PanelLink
                href="#today"
                icon={<CalendarCheckIcon aria-hidden />}
                title="Today"
                text="The cards due now."
              />
              <PanelLink
                href="#stats"
                icon={<BarChart3Icon aria-hidden />}
                title="Stats"
                text="Streaks and retention."
              />
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Together</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 gap-1">
              <PanelLink
                href="#clubs"
                icon={<UsersIcon aria-hidden />}
                title="Clubs"
                text="Learn the same decks together."
              />
              <PanelLink
                href="#connect"
                icon={<SparklesIcon aria-hidden />}
                title="Connect your AI"
                text="Let Claude or ChatGPT make cards."
              />
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#decks" active className={navigationMenuTriggerStyle()}>
            <LayersIcon aria-hidden />
            Decks
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Main: Story = {};
export const WithoutViewport: Story = { args: { viewport: false } };

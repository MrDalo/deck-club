import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BarChart3Icon,
  CalendarCheckIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import { Avatar } from '#components/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  type SidebarProps,
} from '.';

/** The Deck Club mark, for the sidebar stories (apps/web/src/shared/ui/logo.tsx). */
function LogoMark(): React.JSX.Element {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="size-8 shrink-0">
      <rect
        x="9"
        y="5"
        width="22"
        height="28"
        rx="4"
        transform="rotate(-12 20 19)"
        fill="#cdbffb"
        stroke="#24203a"
        strokeWidth="2"
      />
      <rect
        x="11"
        y="8"
        width="22"
        height="28"
        rx="4"
        transform="rotate(8 22 22)"
        fill="#ffffff"
        stroke="#24203a"
        strokeWidth="2"
      />
      <path d="M15.5 17.5 L28.5 19.4" stroke="#bdebd6" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

const DECKS = [
  { name: 'Biology exam', due: 12 },
  { name: 'Spanish verbs', due: 4 },
  { name: 'Chemistry', due: 0 },
];

type ShellProps = Pick<SidebarProps, 'variant' | 'collapsible' | 'side'> & { loading?: boolean };

function Shell({ loading = false, ...sidebar }: ShellProps): React.JSX.Element {
  return (
    <SidebarProvider>
      <Sidebar label="Menu" closeLabel="Close menu" {...sidebar}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#home">
                  <LogoMark />
                  <span className="font-display text-lg font-extrabold group-data-[collapsible=icon]:hidden">
                    Deck Club
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarInput aria-label="Search decks" placeholder="Search decks" />
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main">
            <SidebarGroup>
              <SidebarGroupLabel>Study</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive tooltip="Today">
                      <a href="#today">
                        <CalendarCheckIcon aria-hidden />
                        <span>Today</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>16</SidebarMenuBadge>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Stats">
                      <a href="#stats">
                        <BarChart3Icon aria-hidden />
                        <span>Stats</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Your decks</SidebarGroupLabel>
              <SidebarGroupAction aria-label="New deck">
                <PlusIcon aria-hidden />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading
                    ? [0, 1, 2].map((row) => (
                        <SidebarMenuItem key={row}>
                          <SidebarMenuSkeleton showIcon width={`${80 - row * 15}%`} />
                        </SidebarMenuItem>
                      ))
                    : DECKS.map((deck) => (
                        <SidebarMenuItem key={deck.name}>
                          <SidebarMenuButton asChild tooltip={deck.name}>
                            <a href={`#${deck.name}`}>
                              <LayersIcon aria-hidden />
                              <span>{deck.name}</span>
                            </a>
                          </SidebarMenuButton>
                          {deck.due > 0 && <SidebarMenuBadge>{deck.due}</SidebarMenuBadge>}
                        </SidebarMenuItem>
                      ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Together</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Clubs">
                      <a href="#clubs">
                        <UsersIcon aria-hidden />
                        <span>Clubs</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuAction aria-label="Club options">
                      <MoreHorizontalIcon aria-hidden />
                    </SidebarMenuAction>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#biology-club" isActive>
                          Biology club
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#language-club">
                          Language club
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Connect your AI">
                      <a href="#connect">
                        <SparklesIcon aria-hidden />
                        <span>Connect your AI</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <a href="#settings">
                  <Avatar name="Jana Nováková" size="sm" className="size-6 text-[0.6rem]" />
                  <span>Jana Nováková</span>
                  <SettingsIcon aria-hidden className="ml-auto" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail label="Show or hide the menu" />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b-2 border-line px-4">
          <SidebarTrigger label="Show or hide the menu" />
          <h1 className="font-display text-xl font-bold">Today</h1>
        </header>
        <div className="ruled m-6 max-w-md rounded-card border-2 border-ink p-6 pt-14 shadow-sticker-sm">
          16 cards are due. Press ⌘B (Ctrl+B) to toggle the menu.
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const meta = {
  title: 'Components/Sidebar',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => <Shell /> };
export const Inset: Story = { render: () => <Shell variant="inset" /> };
export const Floating: Story = { render: () => <Shell variant="floating" /> };
export const CollapsesToIcons: Story = { render: () => <Shell collapsible="icon" /> };
export const RightSide: Story = { render: () => <Shell side="right" /> };
export const Loading: Story = { render: () => <Shell loading /> };

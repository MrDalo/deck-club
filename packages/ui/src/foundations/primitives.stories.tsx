import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoldIcon, InfoIcon, ItalicIcon, LayersIcon, UnderlineIcon } from 'lucide-react';
import { Bar, BarChart } from 'recharts';
import { toast } from 'sonner';
import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '#ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#ui/alert-dialog';
import { AspectRatio } from '#ui/aspect-ratio';
import { Avatar, AvatarFallback } from '#ui/avatar';
import { Badge } from '#ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#ui/breadcrumb';
import { Button } from '#ui/button';
import { ButtonGroup, ButtonGroupText } from '#ui/button-group';
import { Calendar } from '#ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '#ui/carousel';
import { ChartContainer } from '#ui/chart';
import { Checkbox } from '#ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '#ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#ui/command';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '#ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '#ui/drawer';
import { Field, FieldDescription, FieldError, FieldLabel } from '#ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '#ui/input-group';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '#ui/input-otp';
import { Item, ItemContent, ItemDescription, ItemTitle } from '#ui/item';
import { Kbd, KbdGroup } from '#ui/kbd';
import { NativeSelect, NativeSelectOption } from '#ui/native-select';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '#ui/empty';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '#ui/hover-card';
import { Input } from '#ui/input';
import { Label } from '#ui/label';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarShortcut,
  MenubarTrigger,
} from '#ui/menubar';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '#ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '#ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '#ui/popover';
import { Progress } from '#ui/progress';
import { RadioGroup, RadioGroupItem } from '#ui/radio-group';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '#ui/resizable';
import { ScrollArea } from '#ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#ui/select';
import { Separator } from '#ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '#ui/sidebar';
import { Skeleton } from '#ui/skeleton';
import { Slider } from '#ui/slider';
import { Toaster } from '#ui/sonner';
import { Spinner } from '#ui/spinner';
import { Switch } from '#ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#ui/tabs';
import { Textarea } from '#ui/textarea';
import { Toggle } from '#ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '#ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#ui/tooltip';

/**
 * The unbranded shadcn/ui layer (src/ui) in the Deck Club theme: what every
 * branded component starts from. Reference only; apps never import these.
 */
const meta = {
  title: 'Foundations/Primitives',
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Section({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold tracking-wide text-ink-soft uppercase">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}

const CARDS = [
  { front: 'Mitosis', back: 'Cell division into two identical cells', due: 'Today' },
  { front: 'Meiosis', back: 'Division into four gametes', due: 'Tomorrow' },
  { front: 'Osmosis', back: 'Water crossing a membrane', due: 'In 3 days' },
];

export const Actions: Story = {
  render: () => (
    <div className="space-y-8">
      <Section title="Button">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="About">
          <InfoIcon />
        </Button>
        <Button disabled>Disabled</Button>
      </Section>
      <Section title="Badge">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Section>
      <Section title="Toggle and toggle group">
        <Toggle aria-label="Bold">
          <BoldIcon />
        </Toggle>
        <Toggle variant="outline" aria-label="Italic" defaultPressed>
          <ItalicIcon />
        </Toggle>
        <ToggleGroup type="multiple" variant="outline" defaultValue={['bold']}>
          <ToggleGroupItem value="bold" aria-label="Bold">
            <BoldIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <ItalicIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <UnderlineIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </Section>
    </div>
  ),
};

export const Forms: Story = {
  render: () => (
    <div className="grid max-w-md gap-6">
      <div className="grid gap-2">
        <Label htmlFor="deck-title">Deck title</Label>
        <Input id="deck-title" placeholder="Biology exam" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="deck-invalid">Invalid input</Label>
        <Input id="deck-invalid" aria-invalid defaultValue="x" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="card-back">Back of the card</Label>
        <Textarea id="card-back" placeholder="The answer" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="deck-language">Language</Label>
        <Select defaultValue="en">
          <SelectTrigger id="deck-language" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="sk">Slovenčina</SelectItem>
            <SelectItem value="cs">Čeština</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="shuffle" defaultChecked />
        <Label htmlFor="shuffle">Shuffle cards</Label>
      </div>
      <RadioGroup defaultValue="good" aria-label="Rating">
        {['again', 'hard', 'good', 'easy'].map((rating) => (
          <div key={rating} className="flex items-center gap-2">
            <RadioGroupItem value={rating} id={`rating-${rating}`} />
            <Label htmlFor={`rating-${rating}`}>{rating}</Label>
          </div>
        ))}
      </RadioGroup>
      <div className="flex items-center gap-2">
        <Switch id="reminders" defaultChecked />
        <Label htmlFor="reminders">Daily reminders</Label>
      </div>
      <div className="grid gap-2">
        <Label id="new-cards-label">New cards per day</Label>
        <Slider defaultValue={[20]} max={50} aria-labelledby="new-cards-label" />
      </div>
    </div>
  ),
};

export const Display: Story = {
  render: () => (
    <div className="space-y-8">
      <Section title="Card">
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Biology exam</CardTitle>
            <CardDescription>42 cards · 12 due today</CardDescription>
          </CardHeader>
          <CardContent>Cells, genetics and evolution.</CardContent>
          <CardFooter>
            <Button>Study now</Button>
          </CardFooter>
        </Card>
      </Section>
      <Section title="Alert">
        <Alert className="w-80">
          <InfoIcon />
          <AlertTitle>Cards added</AlertTitle>
          <AlertDescription>Claude added 10 cards to this deck.</AlertDescription>
        </Alert>
        <Alert variant="destructive" className="w-80">
          <InfoIcon />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>Check your connection and try again.</AlertDescription>
        </Alert>
      </Section>
      <Section title="Avatar, skeleton, progress, separator">
        <Avatar>
          <AvatarFallback>DC</AvatarFallback>
        </Avatar>
        <div className="w-48 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Progress value={60} aria-label="Study progress" className="w-48" />
        <div className="flex h-6 items-center gap-3 text-sm">
          Decks
          <Separator orientation="vertical" />
          Clubs
        </div>
      </Section>
      <Section title="Table">
        <Table className="w-[28rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Front</TableHead>
              <TableHead>Back</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CARDS.map((card) => (
              <TableRow key={card.front}>
                <TableCell>{card.front}</TableCell>
                <TableCell>{card.back}</TableCell>
                <TableCell>{card.due}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
      <Section title="Tabs, accordion, collapsible">
        <Tabs defaultValue="cards" className="w-72">
          <TabsList>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="cards">42 cards in this deck.</TabsContent>
          <TabsContent value="stats">Retention 91%.</TabsContent>
        </Tabs>
        <Accordion type="single" collapsible defaultValue="what" className="w-72">
          <AccordionItem value="what">
            <AccordionTrigger>What is spaced repetition?</AccordionTrigger>
            <AccordionContent>Reviews spread out just before you forget.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="ai">
            <AccordionTrigger>Can my AI add cards?</AccordionTrigger>
            <AccordionContent>Yes, through the Deck Club MCP server.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <Collapsible className="w-60 space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              Show the answer
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="text-sm">The mitochondria.</CollapsibleContent>
        </Collapsible>
      </Section>
      <Section title="Aspect ratio and scroll area">
        <div className="w-48">
          <AspectRatio ratio={3 / 2} className="ruled rounded-md border" />
        </div>
        <ScrollArea className="h-32 w-48 rounded-md border">
          <ul className="p-3 text-sm">
            {Array.from({ length: 12 }, (_, index) => (
              <li key={index} className="py-1">
                Card {index + 1}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Section>
    </div>
  ),
};

export const Navigation: Story = {
  render: () => (
    <div className="space-y-8">
      <Section title="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#decks">Decks</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Biology exam</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>
      <Section title="Pagination">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#page-1" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#page-1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#page-2" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#page-3" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Section>
      <Section title="Navigation menu and menubar">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Study</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#today" className="w-48">
                  Today
                </NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#decks">Decks</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Deck</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New card <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Export</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </Section>
    </div>
  ),
};

export const Overlays: Story = {
  render: () => (
    <Section title="Open each one">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename deck</DialogTitle>
            <DialogDescription>Give the deck a name you will recognise.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Deck name" defaultValue="Biology exam" />
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Alert dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
            <AlertDialogDescription>Its 42 cards are deleted with it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep deck</AlertDialogCancel>
            <AlertDialogAction>Delete deck</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Deck settings</SheetTitle>
            <SheetDescription>Daily limits and reminders.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Popover</Button>
        </PopoverTrigger>
        <PopoverContent>Next review in 3 days.</PopoverContent>
      </Popover>
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="link">Hover card</Button>
        </HoverCardTrigger>
        <HoverCardContent>Added by Claude on 18 November.</HoverCardContent>
      </HoverCard>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Tooltip</Button>
          </TooltipTrigger>
          <TooltipContent>Shortcut: Space</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Dropdown menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Deck</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Show due cards</DropdownMenuCheckboxItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger className="flex h-20 w-48 items-center justify-center rounded-md border border-dashed text-sm">
          Right-click here
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Edit card</ContextMenuItem>
          <ContextMenuItem variant="destructive">Delete card</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </Section>
  ),
};

export const Composites: Story = {
  render: () => (
    <div className="space-y-8">
      <Section title="Button group and empty">
        <ButtonGroup aria-label="Rating">
          <Button variant="outline">Again</Button>
          <Button variant="outline">Good</Button>
          <ButtonGroupText>2 left</ButtonGroupText>
        </ButtonGroup>
        <Empty className="w-72 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayersIcon />
            </EmptyMedia>
            <EmptyTitle>No decks yet</EmptyTitle>
            <EmptyDescription>Make your first deck.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Section>
      <Section title="Calendar and command">
        <Calendar
          mode="single"
          defaultMonth={new Date(2026, 10, 1)}
          className="rounded-md border"
        />
        <Command label="Search" className="w-64 rounded-md border">
          <CommandInput placeholder="Search decks" />
          <CommandList label="Decks">
            <CommandEmpty>No decks.</CommandEmpty>
            <CommandGroup heading="Decks">
              <CommandItem>Biology exam</CommandItem>
              <CommandItem>Spanish verbs</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Section>
      <Section title="Carousel and chart">
        <Carousel className="mx-12 w-56" aria-label="Cards">
          <CarouselContent>
            {['Mitosis', 'Meiosis', 'Osmosis'].map((front) => (
              <CarouselItem key={front}>
                <Card className="h-28 justify-center px-6">{front}</Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious aria-label="Previous card" />
          <CarouselNext aria-label="Next card" />
        </Carousel>
        <ChartContainer
          config={{ reviews: { label: 'Reviews', color: 'var(--chart-1)' } }}
          className="h-40 w-64"
        >
          <BarChart
            data={[
              { day: 'Mon', reviews: 12 },
              { day: 'Tue', reviews: 8 },
              { day: 'Wed', reviews: 15 },
            ]}
          >
            <Bar dataKey="reviews" fill="var(--color-reviews)" radius={4} />
          </BarChart>
        </ChartContainer>
      </Section>
    </div>
  ),
};

export const FormsAndLists: Story = {
  render: () => (
    <div className="space-y-8">
      <Section title="Field, input group, native select">
        <Field className="w-64" data-invalid>
          <FieldLabel htmlFor="primitive-title">Deck title</FieldLabel>
          <Input id="primitive-title" aria-invalid />
          <FieldDescription>Shown on the deck tile.</FieldDescription>
          <FieldError>Give the deck a title.</FieldError>
        </Field>
        <InputGroup className="w-64">
          <InputGroupInput aria-label="Search cards" placeholder="Search cards" />
          <InputGroupAddon align="inline-end">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>
        <NativeSelect aria-label="Language" defaultValue="en">
          <NativeSelectOption value="en">English</NativeSelectOption>
          <NativeSelectOption value="sk">Slovenčina</NativeSelectOption>
        </NativeSelect>
      </Section>
      <Section title="Input OTP, kbd, item, drawer">
        <InputOTP maxLength={4} aria-label="Code">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <Item variant="outline" className="w-64">
          <ItemContent>
            <ItemTitle>Biology exam</ItemTitle>
            <ItemDescription>42 cards</ItemDescription>
          </ItemContent>
        </Item>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Card actions</DrawerTitle>
              <DrawerDescription>Edit, suspend or delete.</DrawerDescription>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      </Section>
    </div>
  ),
};

export const LayoutAndFeedback: Story = {
  render: () => (
    <div className="space-y-8">
      <Section title="Resizable and sidebar">
        <ResizablePanelGroup orientation="horizontal" className="h-40 max-w-md rounded-lg border">
          <ResizablePanel defaultSize="40%" className="flex items-center justify-center">
            Front
          </ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize the card sides" />
          <ResizablePanel defaultSize="60%" className="flex items-center justify-center">
            Back
          </ResizablePanel>
        </ResizablePanelGroup>
        <SidebarProvider className="min-h-0 w-auto">
          <Sidebar collapsible="none" className="h-40 rounded-lg border">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Study</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>Decks</SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Clubs</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </Section>
      <Section title="Spinner and toast">
        <Spinner aria-label="Saving" className="size-6" />
        <Button variant="outline" onClick={() => toast('Deck saved')}>
          Toast
        </Button>
        <Toaster />
      </Section>
    </div>
  ),
};

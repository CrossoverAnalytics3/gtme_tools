/** GTM Toolkit component factories. Each returns an HTMLElement styled by bundle.css. */
declare namespace GTMKit {
  type Child = Node | string | number | null | false | Child[];
  /** Tool ids; each has a sig-<id> and sig-<id>-wash color token. */
  type ToolId =
    | 'launch-lift' | 'adoption-campaign' | 'positioning-lab' | 'inbound-agent' | 'agent-roi'
    | 'win-room' | 'narrative-library' | 'segment-sizer' | 'risk-messaging' | 'fast-five';

  interface ButtonProps { label: string; onClick?: (e: MouseEvent) => void; variant?: 'default' | 'primary' | 'ghost' | 'danger'; size?: 'md' | 'sm'; disabled?: boolean }
  interface FieldProps { id: string; label: string; kind?: 'text' | 'number' | 'select' | 'textarea'; value?: string | number; options?: string[]; placeholder?: string; help?: string; onInput?: (value: string) => void }
  interface TabsProps { items: { id: string; label: string; render: (panel: HTMLElement) => void }[]; initial?: string }
  interface TopBarProps { tools: { id: ToolId; n: number; title: string; href?: string }[]; current?: ToolId; homeHref?: string; name?: string }
  interface ToolHeaderProps { n: number; title: string; role?: string; signalName?: string; summary?: string; outcome: string; metric?: string; source?: string; method?: string; note?: string }
  interface ExampleBannerProps { title?: string; body?: string; primaryLabel?: string; secondaryLabel?: string; onStartBlank?: () => void; onKeep?: () => void }
  interface StatTileProps { label: string; value: string; sub?: string; key?: boolean }
  interface PillProps { text: string; tone?: '' | 'good' | 'warn' | 'bad' | 'info' }
  interface CalloutProps { body: string; title?: string; tone?: '' | 'good' | 'warn' | 'bad' }
  interface DataTableProps { columns: { label: string; key: string; num?: boolean }[]; rows: Record<string, Child>[] }
  interface BarChartProps { rows: { label: string; value: number; display: string; muted?: boolean }[]; max?: number }
  interface MeterProps { value: number; label: string }
  interface ToolCardProps { id: ToolId; n: number; title: string; outcome: string; summary: string; role: string; href?: string; meta?: string }
  interface ConfirmDialogProps { message: string; confirmLabel?: string; danger?: boolean; inline?: boolean }
  interface ToastProps { text: string; inline?: boolean }
}

interface GTMKitNamespace {
  h(tag: string, props?: Record<string, unknown> | null, ...children: GTMKit.Child[]): HTMLElement;
  Button(p: GTMKit.ButtonProps): HTMLButtonElement;
  Field(p: GTMKit.FieldProps): HTMLLabelElement;
  Tabs(p: GTMKit.TabsProps): HTMLElement;
  TopBar(p: GTMKit.TopBarProps): HTMLElement;
  ToolHeader(p: GTMKit.ToolHeaderProps): HTMLElement;
  ExampleBanner(p: GTMKit.ExampleBannerProps): HTMLElement;
  StatTile(p: GTMKit.StatTileProps): HTMLElement;
  Pill(p: GTMKit.PillProps): HTMLElement;
  Callout(p: GTMKit.CalloutProps): HTMLElement;
  DataTable(p: GTMKit.DataTableProps): HTMLElement;
  BarChart(p: GTMKit.BarChartProps): HTMLElement;
  Meter(p: GTMKit.MeterProps): HTMLElement;
  ToolCard(p: GTMKit.ToolCardProps): HTMLAnchorElement;
  ConfirmDialog(p: GTMKit.ConfirmDialogProps): HTMLElement & { result: Promise<boolean> };
  Toast(p: GTMKit.ToastProps): HTMLElement;
}

interface Window { GTMKit: GTMKitNamespace }

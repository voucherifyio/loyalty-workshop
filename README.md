# Loyalty Workshop

A developer tool for visualising and testing the [Voucherify Loyalty V2 API](https://docs.voucherify.io) without using the full dashboard. Point it at any backend that implements the Loyalty V2 API, configure your credentials, and start creating programs, entities, and members immediately.

## Tech Stack

- **Svelte 5** — Modern reactive framework with runes (`$state`, `$derived`, `$effect`)
- **Vite 7** — Fast development server and build tool
- **Tailwind CSS 4 + DaisyUI 5** — Utility-first styling with pre-built components and 32 themes
- **CodeMirror 6** — JSON editor for entity create/edit forms
- **LayerCake + D3** — Composable chart components (stacked bars, multi-line, axes, tooltips)
- **Notyf** — Toast notifications for user feedback
- **Native fetch** — Thin API wrapper with automatic call logging; no SDK, no axios

## Features

### Designer View
Multi-column entity management interface with assignment mode:

#### Entity Management (5 types)
- **Programs**: Full CRUD with activate/deactivate/draft lifecycle
- **Card Definitions**: Manage card templates with code configuration
- **Tier Structures**: Tier hierarchies with nested tiers and a colour-coded progress bar
- **Earning Rules**: Create rules with triggers (order paid, custom event, segment entered) and point effects
- **Rewards**: Material and digital rewards management
- **Incentives**: Points and reward-based incentives

#### Advanced Features
- **Assignment Mode**: Assign/unassign entities to programs via batch API calls with visual feedback
  - Reward cost configuration (card definition + points + stock)
  - Tier-structure picker popover for single-assignment enforcement
- **Entity Usage Tracking**: See which programs use each entity
- **Relationship Graph**: "Linked" tab in entity drawer showing bidirectional references
- **Entity Activities**: Audit log per entity
- **Cursor-based Pagination**: Load more with live countdown timers until cursor expiry
- **Examine Earnings**: Simulate how many points a member would earn from an order

### Member View
Sidebar + tabbed detail panel for comprehensive member management:

- **Card Sidebar**: All member cards with balance, pending points, and tier progress
- **Action Toolbar**: Purchase reward, pay with points, create order, trigger custom event, examine earnings
- **Overview Tab**: Balance tiles with adjust-points action, tier progress timeline, lifetime breakdown, pending/expiring point buckets, card reports with stacked-bar and multi-line charts (configurable range and resolution)
- **Transactions Tabs**: Card transactions, reward purchases, order payments, incentive transactions
- **Timeline Tab**: All transaction types merged into one chronological view with child-tx grouping
- **Activities Tab**: Member-level and card-level activity logs
- **Raw JSON Tab**: Full member object for debugging

### API Inspector
- Chronological log of all API calls made in the session
- Full request and response headers and bodies
- "Copy as cURL" export for reproducing calls in a terminal
- Duration tracking per call

### Connection Settings
- **Theme Picker**: 32 DaisyUI themes
- **Base URL**: Configure the API endpoint (default: `http://localhost:8000`)
- **API Keys**: App ID and App Token stored in `localStorage`
- **Ping Test**: Connectivity check

## Getting Started

### Prerequisites

- Node.js 22+
- A running backend that implements the Voucherify Loyalty V2 API

### Installation

```bash
git clone https://github.com/voucherifyio/loyalty-workshop.git
cd loyalty-workshop
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010).

### Build for Production

```bash
npm run build
npm run preview
```

### Code Quality

```bash
npm run lint
npm run lint:fix
```

## First-Time Setup

1. Open [http://localhost:3010](http://localhost:3010)
2. Click the settings icon (top right)
3. Enter your connection settings:
   - **Base URL**: your API endpoint (e.g. `http://localhost:8000`)
   - **App ID** and **App Token**: your credentials
4. Click **Ping** to verify connectivity
5. Select a theme from the dropdown

## Architecture

Plain Svelte 5 SPA (no SvelteKit, no server-side routing). `index.html` mounts a single `#app` div; `App.svelte` renders the top bar, API inspector, settings modal, and the `Designer` view.

```
src/
├── App.svelte                 # Shell: TopBar, Designer, ApiInspector, SettingsModal
├── main.js                    # Entry point — mounts App into #app
├── app.css                    # Tailwind import + DaisyUI plugin + custom keyframes
├── api/
│   ├── client.js              # ApiClient — fetch wrapper with automatic inspector logging
│   ├── endpoints.js           # All Loyalty V2 API endpoint definitions
│   └── queryString.js         # withQuery() helper to build query strings
├── config/
│   └── designerConfig.js      # Entity-type config, sample payloads, icon map
├── icons/
│   └── index.js               # SVG icon strings used across the app
├── services/
│   └── toast.js               # Notyf-based toast helper
├── stores/
│   ├── connection.svelte.js   # Connection settings (rune-based, persisted to localStorage)
│   ├── theme.svelte.js        # Theme state (persisted to localStorage)
│   ├── api-log.svelte.js      # API call log (in-memory)
│   └── designer/
│       ├── selection.svelte.js      # Selected program/entity state
│       ├── assignment.svelte.js     # Pending assignment changes and batch save
│       ├── pagination.svelte.js     # Cursor state, load-more, refresh
│       └── relationships.svelte.js  # Entity usage/relationship graphs
├── utils/
│   ├── earningRuleSummary.js  # Summarise earning rule trigger/effect counts
│   ├── entityCrud.js          # Per-entity-type endpoint map
│   ├── entityRelationships.js # Relationship resolution helpers
│   ├── entityStyles.js        # CSS class helpers for cards
│   └── transactionFormatting.js # Shared formatters for transaction tables
├── components/
│   ├── charts/
│   │   ├── AxisX.svelte             # X-axis (LayerCake)
│   │   ├── AxisY.svelte             # Y-axis (LayerCake)
│   │   ├── ChartTooltip.svelte      # Hover tooltip
│   │   ├── HoverLayer.svelte        # Transparent hit area for mouse events
│   │   ├── MultiLine.svelte         # Multi-series line chart
│   │   └── StackedBars.svelte       # Stacked bar chart
│   ├── entity/
│   │   ├── EntityActionBar.svelte   # Status transitions + delete in drawer
│   │   ├── EntityActivitiesTab.svelte
│   │   ├── EntityEditTab.svelte     # JSON editor for entity updates
│   │   └── EntityLinkedTab.svelte   # Used-by / Uses bidirectional graph
│   ├── member/
│   │   ├── CardReports.svelte       # Card-level charts and reports
│   │   ├── MemberHeader.svelte
│   │   ├── MemberCardSidebar.svelte
│   │   ├── MemberActionToolbar.svelte
│   │   ├── tabs/
│   │   │   ├── OverviewTab.svelte
│   │   │   ├── TransactionsTab.svelte   # kind prop: cardTx | rewards | orders | incentives
│   │   │   ├── TimelineTab.svelte
│   │   │   ├── ActivitiesTab.svelte
│   │   │   └── RawJsonTab.svelte
│   │   └── dialogs/
│   │       ├── AdjustPointsDialog.svelte
│   │       ├── RefundDialog.svelte
│   │       └── ExamineDialog.svelte
│   ├── ActionToolbar.svelte        # Per-card CRUD action buttons
│   ├── ApiInspector.svelte         # API call log panel
│   ├── AssignmentSaveBar.svelte    # Sticky bar for batch-save / cancel
│   ├── ConfirmationOverlay.svelte  # Inline confirmation for destructive actions
│   ├── CopyId.svelte
│   ├── CreateEntityDrawer.svelte   # Slide-in drawer for entity creation
│   ├── CreateOrderModal.svelte     # Create order to trigger earning rules
│   ├── EntityCard.svelte           # Entity card display
│   ├── EntityColumn.svelte         # Scrollable entity list column
│   ├── EntityDrawer.svelte         # 5-tab entity detail drawer
│   ├── FeatureIcons.svelte
│   ├── FieldValueList.svelte
│   ├── JsonSchemaEditor.svelte     # CodeMirror JSON editor
│   ├── MemberDetailModal.svelte    # Full member detail (thin shell; tabs in member/)
│   ├── MembersDrawer.svelte
│   ├── OrphanTierStructures.svelte
│   ├── PaginationFooter.svelte
│   ├── PayWithPointsModal.svelte   # Pay with loyalty points
│   ├── PointsSection.svelte        # Earning rules, incentives, rewards columns
│   ├── ProgramDateRange.svelte
│   ├── ProgramsSection.svelte      # Programs column
│   ├── PurchaseRewardModal.svelte  # Purchase a reward with points
│   ├── RewardCostPopover.svelte
│   ├── SearchableSelect.svelte
│   ├── SettingsModal.svelte
│   ├── StatusBadge.svelte
│   ├── TierStructureAssignPopover.svelte
│   ├── TopBar.svelte
│   ├── TriggerCustomEventModal.svelte  # Fire a custom event
│   └── WalletsSection.svelte       # Card definitions + tier structures
└── views/
    └── Designer.svelte             # Top-level coordinator (~580 lines)
```

## API

The console communicates with any backend implementing the **Voucherify Loyalty V2 API**. All requests include the `X-Voucherify-API-Version` header (this is the public API contract).

### Supported Endpoints

| Category | Operations |
|---|---|
| Programs | CRUD, activate/deactivate/draft, activities, assignments |
| Card Definitions | CRUD, activate/deactivate/draft, activities |
| Earning Rules | CRUD, activate/deactivate/draft, activities |
| Rewards | CRUD, activate/deactivate/draft, activities |
| Incentives | CRUD, activate/draft, activities |
| Tier Structures | CRUD, activate/deactivate/draft, activities, tiers |
| Members | CRUD, activate/deactivate, activities, cards |
| Member Cards | Adjust points, transactions, pending/expiring points |
| Reward Purchases | List, purchase, refund |
| Orders (v1) | Create to trigger `customer.order.paid` earning rules |
| Events (v1) | Create custom events |
| Examine | Simulate point earnings for a member |

See `src/api/endpoints.js` for the full list.

## Current Limitations

- Most create/edit forms use a raw JSON editor rather than structured form fields
- No advanced filtering or text search across entities
- No bulk export/import of program configurations
- No visual diagram of program structure

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

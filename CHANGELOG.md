# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-05-29

### Added

#### Core Features
- Designer view with multi-column entity management interface
- Complete CRUD operations for Programs, Card Definitions, Tier Structures, Earning Rules, Rewards, and Incentives
- Assignment mode for batch entity-to-program assignments with visual feedback
- Member view with card sidebar and tabbed detail panel
- Comprehensive transaction management (card transactions, reward purchases, order payments, incentive transactions)
- Timeline view merging all transaction types chronologically

#### API Integration
- Full Voucherify Loyalty V2 API integration
- API Inspector for request/response logging
- Copy as cURL functionality for API calls
- Automatic call logging with duration tracking
- Support for custom headers and authentication

#### Visualization
- LayerCake + D3 charting components (stacked bars, multi-line charts)
- Card-level reports with configurable time range and resolution
- Tier progress visualization with color-coded progress bars
- Balance tiles and lifetime breakdown charts
- Pending and expiring point buckets visualization

#### User Interface
- 32 DaisyUI theme support with theme picker
- Tailwind CSS 4 utility-first styling
- CodeMirror 6 JSON editor for entity create/edit forms
- Responsive design with mobile-first approach
- Toast notifications using Notyf

#### Developer Experience
- Svelte 5 with modern runes (`$state`, `$derived`, `$effect`)
- Vite 7 development server with hot module replacement
- ESLint configuration with Svelte 5 support
- Comprehensive style guide and coding standards
- Class-based rune stores for state management

#### Advanced Features
- Entity usage tracking and relationship graphs
- Entity activities and audit logs
- Cursor-based pagination with load-more functionality
- Earning simulation (examine how many points a member would earn)
- Reward purchase and refund workflows
- Point adjustment capabilities
- Custom event triggering
- Order creation to trigger earning rules

### Technical Details
- Node.js 22+ support
- Plain Svelte 5 SPA (no SvelteKit)
- Native fetch API (no external HTTP libraries)
- localStorage for connection settings and theme persistence
- Component-based architecture with clear separation of concerns

### Documentation
- Comprehensive README with feature list and architecture overview
- Detailed STYLE_GUIDE covering component patterns and conventions
- CONTRIBUTING guide for new contributors
- Security policy with vulnerability reporting process
- Code of Conduct based on Contributor Covenant
- MIT License

[Unreleased]: https://github.com/voucherifyio/loyalty-workshop/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/voucherifyio/loyalty-workshop/releases/tag/v1.0.0

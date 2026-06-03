# Loyalty Workshop Style Guide

This document defines the coding standards, component patterns, and styling conventions for the Loyalty Workshop application.

## Table of Contents

- [Component Patterns](#component-patterns)
- [State Management](#state-management)
- [Styling Conventions](#styling-conventions)
- [API Integration](#api-integration)
- [Error Handling](#error-handling)

## Component Patterns

### File Naming

**Rule**: All components use PascalCase with `.svelte` extension

```
✅ Good: CreateEntityDrawer.svelte, MemberDetailModal.svelte, EntityDrawer.svelte
❌ Bad: create-entity-modal.svelte, member_detail_panel.svelte
```

### Props Pattern

**Rule**: Always use `$props()` destructuring with default values

```svelte
<script>
  let {
    open = false,
    entityLabel = "",
    onClose = () => {},
    onSuccess = () => {}
  } = $props();
</script>
```

**Never use**: `export let` (legacy Svelte pattern) or exported functions

```svelte
❌ Bad:
export let open = false;
export function openModal() { ... }
```

### Modal Pattern

**Rule**: Use conditional rendering with `{#if open}` for all modals

```svelte
{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box">
      <!-- Content -->
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleClose}>close</button>
    </form>
  </dialog>
{/if}
```

**Never use**: `<dialog>` bind:this with showModal() API or exported functions

```svelte
❌ Bad:
<dialog bind:this={dialog}>
  ...
</dialog>

$effect(() => {
  if (open && dialog) {
    dialog.showModal();
  }
});
```

###Drawer Pattern

**Rule**: Use fixed positioning with CSS transform for drawers

```svelte
<div 
  class="fixed top-0 right-0 h-full w-[600px] bg-base-100 shadow-2xl z-50 
         transform transition-transform duration-300 ease-in-out 
         {open ? 'translate-x-0' : 'translate-x-full'} flex flex-col"
>
  <!-- Content -->
</div>

{#if open}
  <div class="fixed inset-0 bg-black/50 z-40" onclick={onClose}></div>
{/if}
```

## State Management

### Local State

**Rule**: Use `$state()` for component-local reactive state

```svelte
let loading = $state(false);
let items = $state([]);
let error = $state(null);
```

### Derived Values

**Rule**: Use `$derived()` for computed values that depend on other state

```svelte
const isValid = $derived(items.length > 0 && !loading);
const assignedIds = $derived(new Set(items.filter(i => i.assigned).map(i => i.id)));
```

### Side Effects

**Rule**: Use `$effect()` for reactive side effects (data loading, subscriptions)

```svelte
$effect(() => {
  if (open && entityId) {
    loadData();
  }
});
```

**When to use `$effect()` vs `onMount()`:**
- **Prefer `$effect()`**: For reactive data loading that depends on props/state
- **Use `onMount()` only**: For one-time initialization that doesn't depend on reactivity

### Global Stores

**Rule**: Use Svelte 5 rune-based stores (not writable stores)

```javascript
// ✅ Good: Rune-based store
class ConnectionStore {
  baseUrl = $state('http://localhost:8000');
  connected = $state(false);
  
  setBaseUrl(value) {
    this.baseUrl = value;
    localStorage.setItem('baseUrl', value);
  }
}

export const connection = new ConnectionStore();
```

## Styling Conventions

### Card Structure

**Rule**: Always use `card` + `card-body` wrapper, never direct padding on card

```svelte
✅ Good:
<div class="card bg-base-100">
  <div class="card-body p-4">
    <h3 class="card-title">Title</h3>
    <p>Content</p>
  </div>
</div>

❌ Bad:
<div class="card bg-base-100 p-4">
  <h3>Title</h3>
  <p>Content</p>
</div>
```

### Button Sizing Hierarchy

**Rule**: Consistent button sizes for different contexts

- `btn-xs` - Icon-only buttons in compact toolbars (e.g., ActionToolbar)
- `btn-sm` - Navigation buttons and secondary actions (e.g., TopBar)
- `btn` (default) - Primary actions in forms and dialogs

```svelte
<!-- Toolbar icon button -->
<button class="btn btn-xs btn-circle">
  <svg class="w-3 h-3">...</svg>
</button>

<!-- Navigation button -->
<button class="btn btn-sm">Dashboard</button>

<!-- Primary form action -->
<button class="btn btn-primary">Submit</button>
```

### Grid Gap Standards

**Rule**: Use consistent gap values across the application

- `gap-2` - Tight layouts (badges, compact grids, list items)
- `gap-4` - Standard layouts (card grids, form fields)
- `gap-6` - Spacious layouts (page sections, major components)

```svelte
<!-- Compact grid -->
<div class="grid grid-cols-2 gap-2 text-xs">...</div>

<!-- Standard card grid -->
<div class="grid grid-cols-3 gap-4">...</div>

<!-- Page sections -->
<div class="grid gap-6">...</div>
```

### Alert Structure

**Rule**: Always include icon and consistent wrapper structure

```svelte
<div class="alert alert-{type}">
  <svg class="w-5 h-5 flex-shrink-0">
    <!-- Icon path -->
  </svg>
  <div class="flex-1">
    <div class="font-bold text-sm">{title}</div>
    <p class="text-xs mt-1">{message}</p>
  </div>
</div>
```

**Alert Types**:
- `alert-success` - Successful operations (green)
- `alert-error` - Errors and failures (red)
- `alert-warning` - Warnings and validation issues (yellow)
- `alert-info` - Informational messages (blue)

### Color and Opacity

**Rule**: Use DaisyUI semantic colors with consistent opacity modifiers

**Background Colors**:
- `bg-base-100` - Main background
- `bg-base-200` - Secondary background (cards, panels)
- `bg-base-300` - Tertiary background (borders, dividers)

**Text Colors**:
- `text-base-content` - Primary text
- `text-base-content/70` - Secondary text (70% opacity)
- `text-base-content/50` - Tertiary text (50% opacity)

**Status Colors**:
- `text-success` / `bg-success` - Success states
- `text-error` / `bg-error` - Error states
- `text-warning` / `bg-warning` - Warning states
- `text-primary` / `bg-primary` - Primary brand color

**Highlighting**:
- `ring-2 ring-primary bg-primary/10` - Selected items
- `bg-base-100/90` - Semi-transparent overlays

### Spacing Scale

**Rule**: Use Tailwind's spacing scale consistently

**Padding**:
- `p-2` (0.5rem) - Compact elements
- `p-3` (0.75rem) - Normal elements
- `p-4` (1rem) - Comfortable spacing (default for card-body)

**Margins**:
- `mb-1`, `mb-2`, `mb-4` - Bottom spacing
- `mt-1`, `mt-2`, `mt-4` - Top spacing
- `space-y-2`, `space-y-4` - Vertical spacing between children

### Responsive Design

**Rule**: Use mobile-first responsive classes

```svelte
<!-- Grid responsive -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

<!-- Hide/show responsive -->
<div class="hidden md:block">

<!-- Flex responsive -->
<div class="flex flex-col md:flex-row gap-4">
```

## API Integration

### API Client Usage

**Rule**: Always use centralized API client with automatic logging

```javascript
import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

// ✅ Good: Uses api client
const response = await api.get(endpoints.programs.list());

// ❌ Bad: Direct fetch
const response = await fetch('/v2/loyalties/programs');
```

### API Call Pattern

**Rule**: Standard try-catch with loading and error states

```svelte
<script>
  let loading = $state(false);
  let data = $state(null);
  let error = $state(null);

  async function loadData() {
    loading = true;
    error = null;
    
    try {
      const response = await api.get(endpoints.something());
      data = response.data || response;
    } catch (e) {
      error = e.message;
      toast.error('Failed to load data');
    } finally {
      loading = false;
    }
  }
</script>
```

## Error Handling

### Toast Notifications

**Rule**: Always show toast notifications for user actions

```javascript
import { toast } from '../services/toast.js';

// Success
toast.success('Program created successfully');

// Error
toast.error('Failed to create program');
```

### Error Display

**Rule**: Show errors in both toasts AND inline alerts for form submissions

```svelte
{#if error}
  <div class="alert alert-error">
    <svg class="w-5 h-5 flex-shrink-0">...</svg>
    <div class="flex-1">
      <div class="font-bold text-sm">API Error</div>
      <pre class="text-xs mt-1">{error}</pre>
    </div>
  </div>
{/if}
```

### Error Visibility

Errors from API calls are automatically captured by the **API Inspector** sidebar (every `api.get/post/put/delete` call is logged with full request and response). Do **not** add `console.error` or `console.log` — the inspector and toast notifications are sufficient.

```javascript
catch (err) {
  toast.error('Failed to load programs');
}
```

## Shared Components

### JSON Display

**Rule**: Use `JsonDisplay.svelte` for all JSON rendering

```svelte
import JsonDisplay from '../components/shared/JsonDisplay.svelte';

<!-- Standard display -->
<JsonDisplay data={responseData} />

<!-- With max height -->
<JsonDisplay data={responseData} maxHeight="300px" />

<!-- Compact size -->
<JsonDisplay data={responseData} size="sm" />
```

**Never use**: Inline `<pre>` tags with JSON.stringify

### Loading States

**Rule**: Use `LoadingState.svelte` for consistent loading UI

```svelte
import LoadingState from '../components/shared/LoadingState.svelte';

<!-- Standard loading -->
{#if loading}
  <LoadingState />
{/if}

<!-- With message -->
<LoadingState message="Loading member data..." />

<!-- Different size -->
<LoadingState size="lg" />
```

### Empty States

**Rule**: Use `EmptyState.svelte` for consistent empty state messaging

```svelte
import EmptyState from '../components/shared/EmptyState.svelte';

<!-- Standard empty state -->
{#if items.length === 0}
  <EmptyState message="No items found" />
{/if}

<!-- With variant -->
<EmptyState message="No transactions" variant="info" />
```

### Form Section Cards

**Rule**: Use `FormSectionCard.svelte` for form sections

```svelte
import FormSectionCard from '../components/shared/FormSectionCard.svelte';

<FormSectionCard title="Basic Information">
  <!-- Form fields -->
</FormSectionCard>

<!-- Without title -->
<FormSectionCard>
  <!-- Content -->
</FormSectionCard>
```

### Date/Time Fields

**Rule**: Use `DateTimeField.svelte` for datetime inputs

```svelte
import DateTimeField from '../components/shared/DateTimeField.svelte';

<DateTimeField
  value={startDate}
  fieldName="start_date"
  onInput={(val) => startDate = val}
  onClear={() => startDate = null}
/>
```

### Metadata Editing

**Rule**: Use `MetadataEditor.svelte` for key-value metadata

```svelte
import MetadataEditor from '../components/shared/MetadataEditor.svelte';

<MetadataEditor
  bind:entries={metadataEntries}
  label="Customer Metadata"
/>
```

### Count Badges

**Rule**: Use `CountBadge.svelte` for displaying counts

```svelte
import CountBadge from '../components/shared/CountBadge.svelte';

<CountBadge count={items.length} label="items" />
```

### Modal Structure

**Rule**: Use `BaseModal`, `ModalHeader`, and `ModalFooter` components

```svelte
import BaseModal from '../components/shared/BaseModal.svelte';
import ModalHeader from '../components/shared/ModalHeader.svelte';
import ModalFooter from '../components/shared/ModalFooter.svelte';

{#if open}
  <BaseModal>
    <ModalHeader title="Modal Title" onClose={handleClose} />
    
    <div class="modal-body">
      <!-- Content -->
    </div>
    
    <ModalFooter>
      <button class="btn" onclick={handleClose}>Cancel</button>
      <button class="btn btn-primary" onclick={handleSubmit}>Submit</button>
    </ModalFooter>
  </BaseModal>
{/if}
```

## Component Composition

### Event Handlers

**Rule**: Use `on` prefix for callback props, camelCase naming

```svelte
let {
  onCreate = () => {},
  onUpdate = () => {},
  onDelete = () => {},
  onStatusChange = () => {},
} = $props();
```

### Component Slots

**Rule**: Prefer props over slots for flexibility

```svelte
<!-- ✅ Good: Explicit props -->
<EntityColumn
  items={programs}
  onCreate={handleCreate}
  onSelect={handleSelect}
/>

<!-- ❌ Avoid: Slots for simple content -->
<EntityColumn>
  <svelte:fragment slot="header">...</svelte:fragment>
</EntityColumn>
```

### Icon Usage

**Rule**: Use inline SVG from Heroicons, consistent sizing

```svelte
<!-- Standard icon (w-5 h-5) -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
  <path stroke-linecap="round" stroke-linejoin="round" d="..." />
</svg>

<!-- Small icon for compact UI (w-4 h-4) -->
<svg class="w-4 h-4">...</svg>

<!-- Tiny icon for badges (w-3 h-3) -->
<svg class="w-3 h-3">...</svg>
```

## Testing and Validation

### ESLint

**Rule**: All code must pass ESLint checks before commit

```bash
# Check for linting issues
npm run lint

# Auto-fix issues where possible
npm run lint:fix
```

**Configuration**: `.eslintrc.json` at the repo root with Svelte 5 adaptations.

**Key Rules**:
- **Indentation**: 2 spaces — frontend convention
- **Quotes**: Single quotes in JS — Svelte/frontend convention
- **Console**: Disallowed — use toast notifications and the API Inspector instead
- **Magic Numbers**: Disabled — too restrictive for CSS values and dimensions
- Unix line endings, semicolons required, strict equality (`===`), curly braces required

**Svelte-Specific Rules**:
- Svelte 5 runes compatibility (allows `$state()`, `$derived()`, `$effect()`)
- Component validation for syntax errors
- No unused svelte-ignore comments
- Accessibility warnings
- HTML attribute formatting

### Component Testing Checklist

Before submitting a component:

1. ✅ Props use `$props()` destructuring
2. ✅ Modal uses `{#if open}` conditional rendering
3. ✅ Cards use `card-body` wrapper
4. ✅ Buttons follow sizing hierarchy
5. ✅ Alerts include icons
6. ✅ API calls use centralized client
7. ✅ Errors show toast notifications
8. ✅ State uses `$state()`, `$derived()`, `$effect()`
9. ✅ No ESLint errors
10. ✅ Follows spacing and color conventions

## Migration Guide

### Migrating Old Modals

**From Pattern B (dialog API)** to **Pattern A (conditional rendering)**:

```svelte
<!-- Before -->
let dialog;

$effect(() => {
  if (open && dialog) {
    dialog.showModal();
  }
});

<dialog bind:this={dialog} class="modal">
  ...
</dialog>

<!-- After -->
{#if open}
  <dialog class="modal modal-open">
    ...
  </dialog>
{/if}
```

### Migrating Exported Functions

**From exported functions** to **props-based**:

```svelte
<!-- Before -->
<script>
  export function openModal() {
    dialog.showModal();
  }
</script>

<!-- Usage -->
<SettingsModal bind:this={settingsModal} />
<button onclick={() => settingsModal.openModal()}>

<!-- After -->
<script>
  let { open = false, onClose = () => {} } = $props();
</script>

<!-- Usage -->
<SettingsModal open={settingsModalOpen} onClose={() => settingsModalOpen = false} />
<button onclick={() => settingsModalOpen = true}>
```

## Summary

This style guide ensures:
- **Consistency**: All components follow the same patterns
- **Maintainability**: Easy to understand and modify
- **Svelte 5 Best Practices**: Uses modern runes and patterns
- **DaisyUI Compliance**: Proper use of component library
- **Developer Experience**: Clear conventions, easy to onboard

For questions or proposed changes, discuss with the team before deviating from these standards.

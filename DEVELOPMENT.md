# Development Guide

This guide provides detailed instructions for setting up your development environment and contributing to Loyalty Workshop.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)
- [Backend Setup](#backend-setup)
- [Browser Compatibility](#browser-compatibility)

## Prerequisites

### Required Software

- **Node.js 22.22.0** - Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) for version management
- **npm** (comes with Node.js)
- **Git** for version control
- **A modern browser** - Chrome 120+, Firefox 115+, Safari 17+, or Edge 120+

### Recommended Tools

- **VS Code** with extensions:
  - Svelte for VS Code
  - ESLint
  - Tailwind CSS IntelliSense
  - Prettier (optional)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/voucherifyio/loyalty-workshop.git
cd loyalty-workshop
```

### 2. Install Node.js 22.22.0

Using nvm:
```bash
nvm install 22.22.0
nvm use 22.22.0
```

Using fnm:
```bash
fnm install 22.22.0
fnm use 22.22.0
```

### 3. Install Dependencies

```bash
npm install
```

This installs:
- Svelte 5 and Vite 7 (build tools)
- Tailwind CSS 4 and DaisyUI 5 (styling)
- CodeMirror 6 (JSON editor)
- LayerCake and D3 (charts)
- Notyf (notifications)
- ESLint (linting)

### 4. Verify Installation

```bash
# Check Node.js version
node --version  # Should output v22.22.0

# Check that dependencies are installed
npm list --depth=0

# Run linter to verify setup
npm run lint
```

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

This starts Vite dev server at `http://localhost:3010` with:
- Hot Module Replacement (HMR)
- Automatic browser refresh on file changes
- Source maps for debugging
- Fast rebuild times

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

Build output goes to `dist/` directory.

### Code Quality Checks

```bash
# Run ESLint
npm run lint

# Auto-fix ESLint issues
npm run lint:fix
```

**Important**: All code must pass linting before submitting a PR. The CI pipeline will automatically run these checks.

## Project Structure

```
loyalty-workshop/
├── .github/              # GitHub templates and workflows
│   ├── ISSUE_TEMPLATE/   # Issue templates
│   ├── workflows/        # CI/CD workflows
│   └── PULL_REQUEST_TEMPLATE.md
├── dist/                 # Build output (gitignored)
├── node_modules/         # Dependencies (gitignored)
├── src/                  # Source code
│   ├── api/              # API client and endpoints
│   │   ├── client.js     # HTTP client with logging
│   │   ├── endpoints.js  # API endpoint definitions
│   │   └── queryString.js
│   ├── components/       # Svelte components
│   │   ├── charts/       # Chart components (LayerCake)
│   │   ├── entity/       # Entity management components
│   │   └── member/       # Member management components
│   ├── config/           # Configuration files
│   │   └── designerConfig.js
│   ├── icons/            # SVG icon strings
│   ├── services/         # Business logic services
│   │   └── toast.js      # Toast notification service
│   ├── stores/           # Global state management
│   │   ├── api-log.svelte.js
│   │   ├── connection.svelte.js
│   │   ├── theme.svelte.js
│   │   └── designer/     # Designer-specific stores
│   ├── utils/            # Utility functions
│   ├── views/            # Top-level views
│   │   └── Designer.svelte
│   ├── App.svelte        # Root component
│   ├── app.css           # Global styles (Tailwind imports)
│   └── main.js           # Entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── package.json          # Dependencies and scripts
├── .eslintrc.json        # ESLint configuration
└── README.md             # Project documentation
```

## Common Tasks

### Creating a New Component

1. Create file in `src/components/` using PascalCase:
```bash
touch src/components/MyComponent.svelte
```

2. Follow the component pattern from [STYLE_GUIDE.md](STYLE_GUIDE.md):

```svelte
<script>
  // Props using $props()
  let { open = false, onClose = () => {} } = $props();
  
  // Local state using $state()
  let loading = $state(false);
  
  // Derived values using $derived()
  const isValid = $derived(!loading && open);
  
  // Side effects using $effect()
  $effect(() => {
    if (open) {
      // Do something when opened
    }
  });
</script>

<!-- Template -->
<div class="card bg-base-100">
  <div class="card-body p-4">
    <!-- Content -->
  </div>
</div>
```

### Adding a New API Endpoint

1. Add endpoint definition in `src/api/endpoints.js`:

```javascript
export const endpoints = {
  // ... existing endpoints
  myNewEndpoint: {
    list: () => '/v2/loyalties/my-endpoint',
    get: (id) => `/v2/loyalties/my-endpoint/${id}`,
    create: () => '/v2/loyalties/my-endpoint',
    update: (id) => `/v2/loyalties/my-endpoint/${id}`,
    delete: (id) => `/v2/loyalties/my-endpoint/${id}`
  }
};
```

2. Use in components via the API client:

```javascript
import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

// GET request
const data = await api.get(endpoints.myNewEndpoint.list());

// POST request
const created = await api.post(endpoints.myNewEndpoint.create(), { name: 'Test' });
```

### Adding a New Store

1. Create store file in `src/stores/` with `.svelte.js` extension:

```javascript
// src/stores/myStore.svelte.js
class MyStore {
  items = $state([]);
  loading = $state(false);
  
  addItem(item) {
    this.items.push(item);
  }
  
  clear() {
    this.items = [];
  }
}

export const myStore = new MyStore();
```

2. Use in components:

```svelte
<script>
  import { myStore } from '../stores/myStore.svelte.js';
</script>

<div>{myStore.items.length} items</div>
```

### Styling with Tailwind + DaisyUI

Follow the patterns in [STYLE_GUIDE.md](STYLE_GUIDE.md):

```svelte
<!-- Card with proper structure -->
<div class="card bg-base-100">
  <div class="card-body p-4">
    <h3 class="card-title">Title</h3>
    <p>Content</p>
  </div>
</div>

<!-- Buttons with proper sizing -->
<button class="btn btn-sm btn-primary">Action</button>

<!-- Alert with icon -->
<div class="alert alert-error">
  <svg class="w-5 h-5">{@html errorIcon}</svg>
  <span>Error message</span>
</div>
```

## Debugging

### Using the API Inspector

The built-in API Inspector logs all API requests and responses:

1. Click the API icon in the top-right corner
2. View chronological log of all API calls
3. Inspect request/response headers and bodies
4. Copy calls as cURL for reproduction in terminal

**Tip**: The inspector is invaluable for debugging API issues without opening browser DevTools.

### Browser DevTools

- **Vue DevTools won't work** - this is Svelte, not Vue
- Use browser Console for errors
- Use Network tab for raw HTTP traffic
- Use Sources tab for breakpoints

### Common Debug Patterns

```svelte
<script>
  let data = $state(null);
  
  $effect(() => {
    // This runs when dependencies change
    console.log('Data changed:', data);
  });
  
  // Component props are reactive
  $inspect(data); // Svelte 5 debugging helper
</script>
```

### Vite Debug Mode

```bash
DEBUG=vite:* npm run dev
```

## Troubleshooting

### Port 3010 Already in Use

```bash
# Kill process on port 3010
lsof -ti:3010 | xargs kill -9

# Or change port in vite.config.js
```

### Dependencies Out of Sync

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

### ESLint Errors

```bash
# Auto-fix issues
npm run lint:fix

# Check remaining issues
npm run lint
```

### HMR Not Working

1. Check Vite dev server is running
2. Check browser console for errors
3. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
4. Restart dev server

### Theme Not Persisting

Themes are stored in `localStorage`. Clear browser storage and refresh:

```javascript
// In browser console
localStorage.clear();
location.reload();
```

### API Calls Failing

1. Check connection settings (click settings icon)
2. Verify base URL is correct
3. Check API keys are set
4. Use Ping button to test connectivity
5. Check API Inspector for error details
6. Verify backend is running

## Backend Setup

Loyalty Workshop requires a backend implementing the Voucherify Loyalty V2 API.

### Local Backend

If you're developing a custom backend:

1. Implement the Loyalty V2 API endpoints
2. Run on `http://localhost:8000` (or configure base URL)
3. Ensure CORS is properly configured
4. Include `X-Voucherify-API-Version` header support

### Voucherify Sandbox

To use Voucherify's sandbox environment:

1. Create a free account at [voucherify.io](https://www.voucherify.io)
2. Get your Application ID and Application Token
3. In Loyalty Workshop settings:
   - Base URL: `https://api.voucherify.io`
   - App ID: your Application ID
   - App Token: your Application Token

### API Version

Loyalty Workshop uses `X-Voucherify-API-Version: v2018-08-01` header for all requests.

## Browser Compatibility

### Supported Browsers

- Chrome 120+
- Firefox 115+
- Safari 17+
- Edge 120+

### Required Features

- ES2022 support
- Native `fetch` API
- `localStorage` API
- Modern CSS (Flexbox, Grid, Custom Properties)

### Known Issues

- **Safari < 17**: Limited CSS container query support
- **Firefox < 115**: Some Tailwind features may not work
- **IE 11**: Not supported (EOL)

### Testing Across Browsers

```bash
# Use BrowserStack, or test locally in:
# - Chrome (primary development browser)
# - Firefox (regression testing)
# - Safari (Mac users)
```

## Performance Considerations

### Development Mode Performance

Vite dev server is optimized for speed:
- Modules are loaded on-demand
- HMR updates are instant
- Source maps are generated

### Production Build Performance

```bash
npm run build
```

Produces:
- Minified JavaScript bundles
- Optimized CSS
- Tree-shaken dependencies
- Compressed assets

### Monitoring Performance

Use Chrome DevTools Performance tab to:
- Profile component render times
- Identify slow API calls
- Check for memory leaks

## Additional Resources

- [STYLE_GUIDE.md](STYLE_GUIDE.md) - Coding standards (required reading)
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design decisions
- [API.md](API.md) - API reference
- [Svelte 5 Documentation](https://svelte.dev/docs/svelte/overview)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [DaisyUI Documentation](https://daisyui.com/)

## Getting Help

- **Questions**: Open a [question issue](https://github.com/voucherifyio/loyalty-workshop/issues/new?template=question.md)
- **Bugs**: Open a [bug report](https://github.com/voucherifyio/loyalty-workshop/issues/new?template=bug_report.md)
- **Features**: Open a [feature request](https://github.com/voucherifyio/loyalty-workshop/issues/new?template=feature_request.md)
- **Security**: See [SECURITY.md](SECURITY.md)

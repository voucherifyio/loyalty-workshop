# FAQ

Quick answers to common questions. For detailed guides, see [DEVELOPMENT.md](DEVELOPMENT.md).

## General

**Q: What is this?**  
A: Developer tool for the Voucherify Loyalty V2 API. Not for production use.

**Q: What backends work?**  
A: Any implementing Voucherify Loyalty V2 API (local, sandbox, custom).

**Q: Is it open source?**  
A: Yes, MIT licensed.

## Setup

**Q: What Node.js version?**  
A: Node.js 22.22.0 required. See [DEVELOPMENT.md](DEVELOPMENT.md#initial-setup) for installation.

**Q: Installation fails?**  
A: See [DEVELOPMENT.md - Troubleshooting](DEVELOPMENT.md#troubleshooting) for permission errors, memory issues, etc.

## Connection

**Q: Cannot connect to backend?**  
A: Check: (1) Backend running, (2) Correct base URL in settings, (3) Valid credentials, (4) CORS configured. See [DEVELOPMENT.md](DEVELOPMENT.md#troubleshooting).

**Q: CORS errors?**  
A: Backend must allow `http://localhost:3010` with headers: `Content-Type, X-App-Id, X-App-Token, X-Voucherify-API-Version`.

**Q: 401 Unauthorized?**  
A: Verify credentials in Settings. Check API Inspector for request headers.

**Q: 404 Not Found?**  
A: Backend doesn't implement the endpoint. Check API Inspector for URL.

## Usage

**Q: How to create a loyalty program?**  
A: Click **Create Program**, edit JSON, submit. See [API.md](API.md#programs) for schema.

**Q: How to assign entities to programs?**  
A: Select program → Click **Assign** → Toggle entities → **Save Assignments**.

**Q: Why can't I assign a tier structure?**  
A: Only one tier structure per program allowed.

**Q: How to test earning rules?**  
A: Create member → Create earning rule → Assign to program → Create order → Check card balance.

**Q: What is the API Inspector?**  
A: Logs all API requests/responses. Click icon (top-right). Use "Copy as cURL" to reproduce calls.

**Q: How to change themes?**  
A: Settings (gear icon) → Select theme. 32 DaisyUI themes available.

## Development

**Q: How to add a component?**  
A: See [DEVELOPMENT.md](DEVELOPMENT.md#creating-a-new-component).

**Q: How to use shared components?**  
A: Import from `src/components/shared/`. Available: `JsonDisplay`, `LoadingState`, `EmptyState`, `FormSectionCard`, `DateTimeField`, `MetadataEditor`, `CountBadge`, modal components, and more. See [STYLE_GUIDE.md](STYLE_GUIDE.md#shared-components).

**Q: How to add an API endpoint?**  
A: Add to `src/api/endpoints.js`. See [DEVELOPMENT.md](DEVELOPMENT.md#adding-a-new-api-endpoint).

**Q: What services are available?**  
A: `memberDataService`, `entityCrudService`, `examinationService`, `reportsService`, `tierLoaderService`, `cardActionsService`, `designerStoreCoordinator`, `toast`. Located in `src/services/`.

**Q: Why use runes instead of stores?**  
A: Better reactivity, performance, DX. See [ARCHITECTURE.md](ARCHITECTURE.md#why-svelte-5-with-runes).

**Q: Can I use Svelte 4 patterns?**  
A: No. Svelte 5 only: `$props()` not `export let`, `$state()` not `writable()`.

## Troubleshooting

**Q: Port 3010 in use?**  
A: `lsof -ti:3010 | xargs kill -9` or change port in `vite.config.js`.

**Q: HMR not working?**  
A: Hard refresh (Cmd+Shift+R), restart dev server, or clear cache (`rm -rf node_modules/.vite`).

**Q: Theme not persisting?**  
A: Check browser doesn't block localStorage. Try non-incognito window.

**Q: JSON editor validation errors?**  
A: Fix syntax (missing comma, quote). Validate at jsonlint.com.

**Q: Browser compatibility?**  
A: Chrome 120+, Firefox 115+, Safari 17+, Edge 120+. IE not supported.

## Getting Help

- **Bugs:** [Open bug report](https://github.com/voucherifyio/loyalty-workshop/issues/new?template=bug_report.md)
- **Features:** [Request feature](https://github.com/voucherifyio/loyalty-workshop/issues/new?template=feature_request.md)
- **Questions:** [Ask question](https://github.com/voucherifyio/loyalty-workshop/issues/new?template=question.md)
- **Security:** [SECURITY.md](SECURITY.md)

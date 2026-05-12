# Contributing to Loyalty Workshop

Thank you for your interest in contributing!

## Prerequisites

- Node.js 22+
- A running backend that implements the Voucherify Loyalty V2 API

## Development Setup

```bash
git clone https://github.com/voucherifyio/loyalty-workshop.git
cd loyalty-workshop
npm install
npm run dev
```

## Project Conventions

Read [`STYLE_GUIDE.md`](STYLE_GUIDE.md) before writing code. Key points:

- **Framework**: Svelte 5 with runes — use `$state()`, `$derived()`, `$effect()`, `$props()`
- **Styling**: Tailwind CSS + DaisyUI utility classes; no custom CSS unless unavoidable
- **State**: Class-based rune stores (`class MyStore { state = $state() }`) in `src/stores/`
- **API calls**: Always go through `api.get/post/put/delete` from `src/api/client.js` so they appear in the API Inspector
- **Toast notifications**: Use `toast.success()` / `toast.error()` from `src/services/toast.js`

## Submitting Changes

1. Fork the repository and create a feature branch
2. Run `npm run build` to ensure there are no compilation errors
3. Open a pull request describing what you changed and why

## Reporting Issues

Open a GitHub issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Browser and Node.js version

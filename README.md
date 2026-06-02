# Loyalty Workshop

Developer tool for the [Voucherify Loyalty V2 API](https://docs.voucherify.io). Visualize and test loyalty programs without the full dashboard.

**Stack:** Svelte 5 · Vite 7 · Tailwind CSS 4 · DaisyUI 5 · CodeMirror 6

> **⚠️ Important Notice**  
> This app is **vibe coded** to showcase most of the Voucherify Loyalty V2 API capabilities. It is designed as a developer tool and demonstration, and is **not recommended for production use**. For production implementations, please use the official [Voucherify Dashboard](https://docs.voucherify.io) or follow Voucherify's production-ready integration guidelines.

## Documentation

- **[Development](DEVELOPMENT.md)** — Setup, workflow, troubleshooting
- **[Style Guide](STYLE_GUIDE.md)** — Coding standards *(required reading)*
- **[Architecture](ARCHITECTURE.md)** — System design and decisions
- **[API Reference](API.md)** — Endpoint documentation
- **[FAQ](FAQ.md)** — Common questions
- **[Contributing](CONTRIBUTING.md)** — How to contribute
- **[Changelog](CHANGELOG.md)** — Version history
- **[Security](SECURITY.md)** — Security policy
- **[Code of Conduct](CODE_OF_CONDUCT.md)** — Community guidelines

## Features

**Entity Management:** Programs, Card Definitions, Tier Structures, Earning Rules, Rewards, Incentives  
**Member Management:** Cards, transactions, points, rewards, tier progress  
**API Inspector:** Request/response logging with cURL export  
**Themes:** 32 DaisyUI themes  
**Charts:** Balance trends, tier progress visualization

## Quick Start

```bash
git clone https://github.com/voucherifyio/loyalty-workshop.git
cd loyalty-workshop
npm install
npm run dev
```

Open [http://localhost:3010](http://localhost:3010). Configure your API endpoint and credentials in settings.

**Requirements:** Node.js 22+, backend implementing Voucherify Loyalty V2 API

For detailed setup instructions, see [DEVELOPMENT.md](DEVELOPMENT.md).

## License

[MIT](LICENSE)

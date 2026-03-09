# GroceryIQ

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude-Vision_AI-orange?style=flat-square)
![SQLite](https://img.shields.io/badge/SQLite-local-003B57?style=flat-square&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Local First](https://img.shields.io/badge/data-local_only-teal?style=flat-square)

**AI-powered grocery receipt tracking — scan receipts, analyse spending, and stay on top of your grocery habits.**

[Features](#features) · [Getting Started](#getting-started) · [Usage](#usage) · [Architecture](#architecture) · [Troubleshooting](#troubleshooting)

</div>

---

GroceryIQ is a local-first grocery management app that uses Claude Vision AI to automatically parse receipt images into structured data. Track spending by vendor, category, and month — with full item-level history — all stored on your own machine with no cloud database required.

> 🔒 **Your data stays local.** All receipt images and spending data are stored in a SQLite file on your machine. The only external call is to the Anthropic API for receipt parsing.

---

## Features

### 🧾 AI Receipt Parsing
Drag and drop a receipt image (JPG, PNG, HEIC) and Claude Vision AI extracts the store name, date, every line item, and total price automatically. Review and correct any field before saving.

### 📋 Receipt Management
Browse your full receipt history in a gallery view. Click any receipt to see the full itemised breakdown, edit details, or delete it. Thumbnail previews are generated automatically on upload.

### 📊 Spending Dashboard
A rich analytics dashboard with date-range filtering (this month / last 3 months / last 6 months / all time):

| Chart | Shows |
|---|---|
| Vendor Spending | Bar chart of total spend per store |
| Category Spending | Breakdown by item category |
| Monthly Trend | Line chart of total grocery spend over time |
| Top Items | Most frequently purchased items by volume and spend |

### 🗂️ Item Management
Phase 2 introduces item-level tracking with normalised item names, bulk category updates, and a master item list to see purchase frequency and price history across receipts.

### 🛒 Shopping List
Generate and manage a shopping list informed by your purchase history.

### ⚙️ Settings
Configure app preferences, manage data, and control receipt processing behaviour.

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 15 | App Router, API routes, SSR |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Full type safety across app and API |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | latest | Accessible component primitives |
| [Drizzle ORM](https://orm.drizzle.team/) | 0.45 | Type-safe SQLite schema and queries |
| [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) | 12 | Synchronous SQLite driver (local file) |
| [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) | 0.72 | Claude Vision API for receipt parsing |
| [Recharts](https://recharts.org/) | 3 | Dashboard analytics charts |
| [date-fns](https://date-fns.org/) | 4 | Date formatting and range helpers |
| [Sharp](https://sharp.pixelplumbing.com/) | latest | Thumbnail generation on upload |
| [React Hook Form](https://react-hook-form.com/) | 7 | Form state and validation |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- An Anthropic API key — [get one here](https://console.anthropic.com/)

### Installation

```bash
git clone https://github.com/dnd1097/grocery-tracker.git
cd grocery-tracker
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=file:./local.db
```

### Run Database Migrations

```bash
npm run db:migrate
```

This creates `local.db` with all required tables and indexes.

### Start the Development Server

```bash
npm run dev
# → http://localhost:3000
```

---

## Usage

1. **Upload a receipt** — go to the Receipts page and drag & drop or click to upload an image.
2. **AI parsing** — Claude Vision extracts the store name, date, items, quantities, and prices automatically.
3. **Review & save** — check the extracted data, correct any errors, and save.
4. **Dashboard** — view spend by vendor, category, and month on the analytics dashboard. Use the date-range filter to focus on any time window.
5. **Item history** — browse the Items view to see normalised purchase history across all receipts.
6. **Shopping list** — build a list informed by your past purchases.

---

## Architecture

```
grocery-tracker/
├── app/
│   ├── page.tsx                    — dashboard (analytics + date filter)
│   ├── layout.tsx                  — root layout
│   ├── receipts/                   — receipt gallery + detail pages
│   ├── settings/                   — app settings page
│   └── api/
│       ├── receipts/               — CRUD + upload + AI parse endpoints
│       ├── items/                  — item management endpoints
│       ├── items/bulk-update/      — bulk category assignment
│       └── categories/             — category listing endpoint
├── components/
│   ├── dashboard/
│   │   ├── VendorSpendingChart     — bar chart by store
│   │   ├── CategorySpendingChart   — spend by category
│   │   ├── MonthlyTrendChart       — monthly line chart
│   │   ├── TopItemsList            — most purchased items
│   │   └── DateRangeFilter         — this-month / 3mo / 6mo / all
│   ├── receipts/
│   │   └── ReceiptEditor           — line-item edit form
│   ├── items/
│   │   └── ItemsView               — item master list + bulk edit
│   ├── settings/                   — settings panel components
│   └── shared/
│       └── Header                  — app navigation header
├── lib/
│   ├── db/
│   │   ├── schema.ts               — Drizzle table definitions
│   │   └── index.ts                — Better-SQLite3 connection
│   └── utils/
│       ├── analytics.ts            — spending aggregation helpers
│       ├── categories.ts           — category constants and mapping
│       └── item-aggregation.ts     — item normalisation logic
├── drizzle/
│   └── migrations/                 — auto-generated SQL migrations
├── types/                          — shared TypeScript interfaces
└── public/uploads/
    ├── receipts/                   — original receipt images
    └── thumbnails/                 — 300px-wide preview images
```

### Key Design Decisions

- **Local-first with SQLite** — Better-SQLite3 runs synchronously in the Next.js API layer, keeping the stack simple with no connection pooling or cloud DB required.
- **Drizzle ORM** — provides type-safe schema definitions and query builders without the overhead of a full ORM like Prisma.
- **Claude Vision for parsing** — the receipt image is base64-encoded and sent to Claude's vision API with a structured prompt; the response is parsed into a typed receipt object.
- **Thumbnail pipeline** — Sharp generates a 300px-wide JPEG thumbnail on upload, keeping the gallery fast even with large original images.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate a new Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to `local.db` |
| `npm run db:studio` | Open Drizzle Studio — a local database GUI |

---

## Data Storage

| Asset | Location |
|---|---|
| Database | `local.db` (SQLite, project root) |
| Receipt images | `public/uploads/receipts/` |
| Thumbnails | `public/uploads/thumbnails/` |

All data is stored locally on your machine. Deleting `local.db` resets all receipt and spending data.

---

## Troubleshooting

**Receipt parsing fails**
- Verify `ANTHROPIC_API_KEY` is set correctly in `.env.local`
- Ensure the receipt image is clear and well-lit
- You can always edit the extracted data manually after upload

**Database errors**
- Delete `local.db` and re-run `npm run db:migrate` to reset the schema
- Check you have write permissions in the project directory

**Image upload fails**
- Confirm `public/uploads/receipts/` and `public/uploads/thumbnails/` directories exist
- Ensure the image file is under 10 MB

---

## License

MIT

---

<div align="center">
  <sub>Built with Next.js + Claude AI · Designed for personal use</sub>
</div>

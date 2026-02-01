# GroceryIQ

A personal grocery management web app that helps you track spending, manage receipts, and predict what you'll need to buy next.

## Features

- **Receipt Upload & Parsing**: Upload receipt images and use Claude Vision AI to automatically extract store, date, items, and prices
- **Receipt Management**: Browse all receipts in a gallery view, edit details, and manage your purchase history
- **Spending Dashboard**: View spending statistics and recent receipts
- **Local-First**: Runs entirely on your MacBook with no cloud dependencies (except Claude API for parsing)

## Tech Stack

- **Framework**: Next.js 16 with App Router & TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Better-SQLite3 + Drizzle ORM
- **AI**: Anthropic Claude Vision API for receipt parsing
- **Image Processing**: Sharp for thumbnails

## Prerequisites

- Node.js 18+ installed
- npm (comes with Node.js)
- An Anthropic API key ([get one here](https://console.anthropic.com/))

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=file:./local.db
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This creates the SQLite database and tables.

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a Receipt**: Go to the Receipts page and drag & drop or click to upload a receipt image
2. **AI Processing**: Claude Vision will automatically extract the store name, date, items, and prices
3. **Review & Edit**: Review the extracted data and make any corrections needed
4. **Track Spending**: View your spending stats on the dashboard

## Project Structure

```
grocery-tracker/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── receipts/          # Receipt pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard
├── components/            # React components
│   ├── receipts/          # Receipt-specific components
│   ├── shared/            # Shared components
│   └── ui/                # shadcn/ui components
├── lib/                   # Core business logic
│   ├── db/                # Database schema & connection
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── types/                 # TypeScript types
└── public/uploads/        # Stored receipt images
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate new database migration
- `npm run db:migrate` - Apply database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## Data Storage

- **Database**: `local.db` (SQLite file in project root)
- **Images**: `public/uploads/receipts/` (original images)
- **Thumbnails**: `public/uploads/thumbnails/` (300px width)

All data is stored locally on your machine.

## Future Phases

- **Phase 2**: Item normalization and purchase history tracking
- **Phase 3**: Analytics dashboard with charts and insights
- **Phase 4**: Smart shopping list generation based on purchase patterns
- **Phase 5**: UI polish, dark mode, and advanced features

## Troubleshooting

### Receipt parsing fails

- Make sure your `ANTHROPIC_API_KEY` is set correctly in `.env.local`
- Check that the image is clear and readable
- You can manually edit the receipt after upload if parsing fails

### Database errors

- Delete `local.db` and run `npm run db:migrate` again
- Check that you have write permissions in the project directory

### Image upload fails

- Check that `public/uploads/receipts/` and `public/uploads/thumbnails/` directories exist
- Ensure images are under 10MB

## License

MIT

## Author

Built with Claude Code

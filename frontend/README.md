# H1B Wages Explorer - Frontend

A Next.js application for exploring H1B visa salary data. Built with shadcn/ui, TanStack Query, and Recharts.

## Quick Start (Local Development)

```bash
# 1. Make sure the backend is running first (from project root):
docker compose up -d
# Then load data if not already loaded:
# docker cp h1b.csv postgrest-db:/tmp/h1b.csv
# docker exec postgrest-db psql -U postgres -c "COPY public.h1b_lca_data (...) FROM '/tmp/h1b.csv' ..."

# 2. Install frontend dependencies:
cd frontend
npm install

# 3. Start dev server:
npm run dev
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000
```

## Environment Variables

Copy `.env.example` to `.env.local` and set the API URL:

```bash
# Local development (default)
NEXT_PUBLIC_API_URL=http://localhost:3000

# DigitalOcean production
NEXT_PUBLIC_API_URL=https://your-backend.ondigitalocean.app

# AWS or custom domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Deployment Options

### Option A: DigitalOcean App Platform (both frontend + backend)

Add the frontend as a static site in your `.do/app.yaml`:

```yaml
static_sites:
  - name: h1b-frontend
    github:
      repo: your-username/your-repo
      branch: main
      deploy_on_push: true
    source_dir: frontend
    build_command: npm run build
    output_dir: .next
    envs:
      - key: NEXT_PUBLIC_API_URL
        value: ${postgrest-service.PUBLIC_URL}
```

### Option B: Cloudflare Pages (frontend) + DigitalOcean (backend)

1. Uncomment `output: "export"` in `next.config.ts`
2. Connect your GitHub repo to Cloudflare Pages
3. Set build settings:
   - Build command: `cd frontend && npm run build`
   - Build output: `frontend/out`
   - Environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.ondigitalocean.app`

### Option C: Vercel (frontend) + DigitalOcean (backend)

1. Import the repo on Vercel
2. Set root directory to `frontend`
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.ondigitalocean.app`

### Option D: AWS (frontend) + DigitalOcean (backend)

**S3 + CloudFront (static export):**
1. Uncomment `output: "export"` in `next.config.ts`
2. Run `npm run build` - output is in the `out/` folder
3. Upload `out/` contents to S3 bucket
4. Create CloudFront distribution pointing to S3
5. Set `NEXT_PUBLIC_API_URL` at build time

**AWS Amplify:**
1. Connect GitHub repo to Amplify
2. Set build settings similar to Vercel
3. Set environment variable for API URL

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with Header/Footer
│   │   ├── page.tsx          # Home page (search + stats + top paying)
│   │   ├── search/page.tsx   # Search page (filters + data table)
│   │   └── stats/page.tsx    # Statistics dashboard (charts)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── header.tsx        # Responsive navigation header
│   │   ├── footer.tsx        # Site footer
│   │   ├── search-bar.tsx    # Global search component
│   │   ├── search-filters.tsx # Advanced filter panel
│   │   ├── data-table.tsx    # Sortable, paginated data table
│   │   └── stats-cards.tsx   # Summary statistic cards
│   └── lib/
│       ├── api.ts            # PostgREST API client
│       ├── types.ts          # TypeScript interfaces
│       ├── format.ts         # Number/currency formatters
│       ├── providers.tsx     # React Query provider
│       └── utils.ts          # shadcn/ui utilities
├── .env.local                # Local environment variables
├── .env.example              # Template for environment variables
└── next.config.ts            # Next.js configuration
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **shadcn/ui** - UI component library
- **Tailwind CSS v4** - Styling
- **TanStack Query** - Data fetching & caching
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons

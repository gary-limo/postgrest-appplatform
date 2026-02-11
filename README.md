# H1B LCA Wages Data — PostgREST on DigitalOcean App Platform

A production-ready H1B visa wages data explorer powered by [PostgREST](https://postgrest.org) on DigitalOcean App Platform. Automatically generates a read-only RESTful API from PostgreSQL.

## Architecture

- **Backend**: PostgREST (auto-generated REST API from PostgreSQL schema)
- **Frontend**: Next.js (App Router, SSR, Tailwind CSS, shadcn/ui, Recharts)
- **Database**: PostgreSQL 16 with pre-computed aggregation tables
- **Security**: All write operations (POST, PATCH, DELETE) are disabled at the database level

## API Endpoints (READ-ONLY)

| Endpoint | Description |
|---|---|
| `GET /h1b_lca_data` | H1B LCA data (~451K records, paginated) |
| `GET /h1b_lca_stats` | Aggregate statistics (1 row, pre-computed) |
| `GET /h1b_distinct_employers` | Distinct employers with filing counts |
| `GET /h1b_distinct_jobs` | Distinct job titles per employer |
| `GET /h1b_distinct_locations` | Distinct locations per employer |
| `GET /h1b_state_stats` | State-level filing aggregation |
| `GET /` | OpenAPI documentation |

## Quick Start

### Local Development

```bash
git clone https://github.com/gary-limo/postgre.git
cd postgre

# Start PostgREST + PostgreSQL
docker-compose up

# Load H1B data (in a separate terminal)
psql -h localhost -U postgres -d postgres -f config/load_h1b_data.sql

# Start frontend (in a separate terminal)
cd frontend && npm install && npm run dev
```

- API: http://127.0.0.1:3000
- Frontend: http://localhost:3001

See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for more details.

### Production Deployment

**Step 1: Create a PostgreSQL database**
```bash
doctl databases create postgrest-db --engine pg --version 16 --region nyc3 --size db-s-1vcpu-1gb
```

**Step 2: Update `.do/production-app.yaml`**
- Ensure `repo` points to your GitHub repository
- Ensure `branch` is set to your deployment branch

**Step 3: Deploy the PostgREST backend**
```bash
doctl apps create --spec .do/production-app.yaml
```

The `db-init` PRE_DEPLOY job runs `config/init.production.sql` automatically to create all table schemas.

**Step 4: Load H1B data into production**
```bash
psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" \
  -f config/load_h1b_data_production.sql
```

This loads the CSV data and populates all pre-computed derived tables.

**Step 5: Deploy the frontend**

Deploy the `frontend/` directory as a separate static site on App Platform, Cloudflare Pages, or Vercel. Set the `NEXT_PUBLIC_API_URL` environment variable to your PostgREST backend URL.

## Database Schema

### Source Table
- `h1b_lca_data` — Raw H1B LCA disclosure data (~451K records)

### Pre-computed Tables (populated once after data load)
- `h1b_lca_stats` — Aggregate statistics (1 row)
- `h1b_distinct_employers` — Distinct employers with filing counts (57K rows)
- `h1b_distinct_jobs` — Distinct job/employer pairs (223K rows)
- `h1b_distinct_locations` — Distinct location/employer pairs (252K rows)
- `h1b_state_stats` — State-level aggregation (54 rows)

Pre-computed tables eliminate expensive runtime aggregations. Every API call reads from ready-made tables.

## Customization

**Database schema**: Edit `config/init.sql` (dev) or `config/init.production.sql` (production)

**Data loading**: Edit `config/load_h1b_data.sql` (dev) or `config/load_h1b_data_production.sql` (production)

## Resources

- [PostgREST Documentation](https://postgrest.org/)
- [DigitalOcean App Platform Documentation](https://docs.digitalocean.com/products/app-platform/)
- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [Local Development Guide](LOCAL_DEVELOPMENT.md)

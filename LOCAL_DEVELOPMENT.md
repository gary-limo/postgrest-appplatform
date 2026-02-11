# Local Development Guide

Run PostgREST locally for development and testing.

## Quick Start

```bash
git clone https://github.com/AppPlatform-Templates/postgrest-appplatform.git
cd postgrest-appplatform

# Optional: Customize credentials
cp .env.example .env
# Edit .env with your preferred credentials

# Start services
docker-compose up
```

**Access**:
- API: http://127.0.0.1:3000
- PostgreSQL: 127.0.0.1:5432 (default: user `postgres`, password `postgres`)

The database schema initializes automatically using `config/init.sql`.

After services are up, load the H1B data:
```bash
psql -h localhost -U postgres -d postgres -f config/load_h1b_data.sql
```

**Using Custom Credentials**: Create a `.env` file from `.env.example` and set your own database credentials. All values have defaults, so `.env` is optional for local development.

## API Examples (READ-ONLY)

All endpoints are read-only. POST, PATCH, and DELETE are disabled at the database level.

**H1B data (paginated)**:
```bash
curl "http://127.0.0.1:3000/h1b_lca_data?limit=5&order=wage_rate_of_pay_from.desc"
```

**Aggregate statistics**:
```bash
curl http://127.0.0.1:3000/h1b_lca_stats
```

**Search employers**:
```bash
curl "http://127.0.0.1:3000/h1b_distinct_employers?employer_name=ilike.*GOOGLE*&order=filing_count.desc&limit=10"
```

**State-level stats**:
```bash
curl "http://127.0.0.1:3000/h1b_state_stats?order=filing_count.desc"
```

**OpenAPI docs**: http://127.0.0.1:3000/

## Database Access

```bash
# Connect via Docker
docker exec -it postgrest-db psql -U postgres

# Or from host (requires psql)
psql -h 127.0.0.1 -U postgres -d postgres
```

## Development Workflow

**Modify database schema**:
1. Edit `config/init.sql`
2. Rebuild: `docker-compose down -v && docker-compose up`
3. Reload data: `psql -h localhost -U postgres -d postgres -f config/load_h1b_data.sql`

**Modify PostgREST config**:
1. Edit `config/postgrest.conf` or `docker-compose.yml`
2. Restart: `docker-compose restart postgrest`

## Advanced

**Expose multiple schemas**:
```yaml
# docker-compose.yml
environment:
  - PGRST_DB_SCHEMAS=api,admin,public
```
Access at: `/api/*`, `/admin/*`, `/public/*`

**Enable JWT auth**: See [PostgREST Authentication](https://postgrest.org/en/stable/tutorials/tut1.html)

**Row-level security**: See [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

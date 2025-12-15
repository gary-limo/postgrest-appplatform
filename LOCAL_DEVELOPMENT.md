# Local Development Guide

This guide covers setting up and running the PostgREST template locally for development and testing.

## Prerequisites

- Docker and Docker Compose installed
- Basic understanding of PostgreSQL and REST APIs
- (Optional) curl or Postman for testing API endpoints

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AppPlatform-Templates/postgrest-appplatform.git
   cd postgrest-appplatform
   ```

2. **Start the services**:
   ```bash
   docker-compose up
   ```

3. **Access the API**:
   - API: http://127.0.0.1:3000
   - PostgreSQL: 127.0.0.1:5432

## Docker Compose Services

The `docker-compose.yml` defines two services:

### PostgreSQL Database
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Credentials**:
  - Database: `postgres`
  - User: `postgres`
  - Password: `postgres`
- **Initialization**: Runs `config/init.sql` on first startup

### PostgREST Server
- **Port**: 3000
- **Configuration**: Environment variables in docker-compose.yml
- **Health Check**: Validates server is responding

## Testing the API

### View OpenAPI Documentation

```bash
curl http://127.0.0.1:3000/
```

This returns the auto-generated OpenAPI schema for your API.

### CRUD Operations

**List all todos**:
```bash
curl http://127.0.0.1:3000/todos
```

**Get a specific todo**:
```bash
curl "http://127.0.0.1:3000/todos?id=eq.1"
```

**Create a todo**:
```bash
curl -X POST http://127.0.0.1:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "My new task", "completed": false}'
```

**Update a todo**:
```bash
curl -X PATCH "http://127.0.0.1:3000/todos?id=eq.1" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**Delete a todo**:
```bash
curl -X DELETE "http://127.0.0.1:3000/todos?id=eq.1"
```

**Get statistics**:
```bash
curl http://127.0.0.1:3000/todos_stats
```

## Connecting to PostgreSQL

You can connect directly to PostgreSQL for database management:

```bash
# Using psql
docker exec -it postgrest-db psql -U postgres

# Or from host machine (requires psql installed)
psql -h 127.0.0.1 -U postgres -d postgres
```

**Useful SQL commands**:
```sql
-- List all tables in api schema
\dt api.*

-- View table structure
\d api.todos

-- Query data
SELECT * FROM api.todos;

-- View permissions
\dp api.todos
```

## Development Workflow

### Modifying the Database Schema

1. Edit `config/init.sql` to add/modify tables, views, or functions
2. Rebuild the database:
   ```bash
   docker-compose down -v
   docker-compose up
   ```

3. Test your changes via the API

### Modifying PostgREST Configuration

1. Edit `config/postgrest.conf` or environment variables in `docker-compose.yml`
2. Restart PostgREST:
   ```bash
   docker-compose restart postgrest
   ```

### Live Reloading

To enable live reloading during development, uncomment the volumes section in `docker-compose.yml`:

```yaml
volumes:
  - ./config/postgrest.conf:/config/postgrest.conf
```

Then restart:
```bash
docker-compose restart postgrest
```

## Troubleshooting

### PostgREST won't start

**Issue**: Container exits immediately

**Solution**: Check logs for configuration errors:
```bash
docker-compose logs postgrest
```

Common issues:
- Invalid database URI
- Database role doesn't exist
- Schema not accessible

### Can't connect to database

**Issue**: PostgREST can't connect to PostgreSQL

**Solution**: Ensure PostgreSQL is fully initialized:
```bash
docker-compose logs postgres
```

Wait for message: "database system is ready to accept connections"

### API returns empty results

**Issue**: Queries return `[]` or no data

**Solution**: Verify data exists and permissions are correct:
```bash
docker exec -it postgrest-db psql -U postgres -c "SELECT * FROM api.todos;"
```

Check role permissions:
```sql
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'api' AND table_name = 'todos';
```

### Port already in use

**Issue**: Port 3000 or 5432 already in use

**Solution**: Change ports in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Changed from 3000:3000
```

## Advanced Configuration

### Adding JWT Authentication

1. Generate a JWT secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `docker-compose.yml`:
   ```yaml
   environment:
     - PGRST_JWT_SECRET=your-secret-here
   ```

3. Update database roles for authenticated users

See [PostgREST Authentication Docs](https://postgrest.org/en/stable/references/auth.html) for details.

### Enabling Multiple Schemas

To expose multiple schemas:

```yaml
environment:
  - PGRST_DB_SCHEMAS=api,admin,public
```

Schemas are exposed at their respective paths: `/api/*`, `/admin/*`, `/public/*`

## Next Steps

- Read the [PostgREST Tutorial](https://postgrest.org/en/stable/tutorials/tut0.html)
- Explore [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Check out [PostgREST API Reference](https://postgrest.org/en/stable/references/api.html)
- Deploy to App Platform (see main [README.md](README.md))

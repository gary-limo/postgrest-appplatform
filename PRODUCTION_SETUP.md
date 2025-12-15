# Production Setup Guide

## Good News: Automatic Initialization! 🎉

The database is **automatically initialized** on deployment via an App Platform PRE_DEPLOY job. The `config/init.sql` script runs before your PostgREST service starts, so your API works immediately!

This guide is only needed if:
- ❌ The automatic initialization failed
- 🔧 You want to manually modify the database
- 📝 You need to understand what's being created

## Step 1: Deploy the App

Deploy using one of these methods:
```bash
# Via CLI
doctl apps create --spec .do/app.yaml

# Or use the Deploy to DigitalOcean button
```

Wait for the deployment to complete.

## Step 2: Get Database Connection Details

```bash
# Get your app ID
doctl apps list

# Get database connection info
doctl databases connection <database-id> --format Host,Port,User,Password,Database
```

Or retrieve from the App Platform console:
1. Go to your app in the App Platform dashboard
2. Click on the database component
3. View connection details

## Step 3: Connect to Database

Using psql from your local machine:

```bash
psql "postgresql://username:password@host:port/database?sslmode=require"
```

Or use the doctl shortcut:

```bash
doctl databases db shell <database-id>
```

## Step 4: Run Initialization Script

Once connected, run the initialization script:

```sql
-- Create API schema
CREATE SCHEMA IF NOT EXISTS api;

-- Create web_anon role for anonymous API access
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;
END
$$;

-- Grant usage on API schema to web_anon
GRANT USAGE ON SCHEMA api TO web_anon;

-- Create a sample table
CREATE TABLE IF NOT EXISTS api.todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grant permissions to web_anon
GRANT SELECT, INSERT, UPDATE, DELETE ON api.todos TO web_anon;
GRANT USAGE, SELECT ON SEQUENCE api.todos_id_seq TO web_anon;

-- Insert sample data (optional)
INSERT INTO api.todos (title, completed) VALUES
  ('Learn PostgREST', false),
  ('Deploy to App Platform', false),
  ('Build amazing APIs', false)
ON CONFLICT DO NOTHING;

-- Create a sample view
CREATE OR REPLACE VIEW api.todos_stats AS
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE completed) as completed_count,
    COUNT(*) FILTER (WHERE NOT completed) as pending_count
  FROM api.todos;

-- Grant select permission on the view
GRANT SELECT ON api.todos_stats TO web_anon;
```

Or copy the entire contents of `config/init.sql` and paste it into the psql prompt.

## Step 5: Verify Setup

Test your API endpoints:

```bash
# Get your app URL
APP_URL=$(doctl apps get <app-id> --format DefaultIngress --no-header)

# Test the API
curl https://$APP_URL/todos
curl https://$APP_URL/todos_stats
```

## Customizing Your Database Schema

To create your own schema instead of the sample todos:

1. Modify `config/init.sql` with your tables, views, and functions
2. Keep the schema creation and role setup:
   ```sql
   CREATE SCHEMA IF NOT EXISTS api;
   CREATE ROLE web_anon NOLOGIN;
   GRANT USAGE ON SCHEMA api TO web_anon;
   ```
3. Run your modified script against the production database

## Security Best Practices

1. **Remove Sample Data**: After testing, remove the sample todos:
   ```sql
   DELETE FROM api.todos;
   ```

2. **Restrict Permissions**: Grant only necessary permissions to `web_anon`:
   ```sql
   -- Example: Read-only access
   GRANT SELECT ON api.todos TO web_anon;
   REVOKE INSERT, UPDATE, DELETE ON api.todos FROM web_anon;
   ```

3. **Use Row-Level Security (RLS)**: Implement fine-grained access control:
   ```sql
   ALTER TABLE api.todos ENABLE ROW LEVEL SECURITY;

   CREATE POLICY anon_select ON api.todos
     FOR SELECT TO web_anon
     USING (true);
   ```

4. **Add JWT Authentication**: See [PostgREST Authentication Docs](https://postgrest.org/en/stable/references/auth.html)

## Troubleshooting

### Error: "schema 'api' does not exist"
Run the initialization script (Step 4).

### Error: "role 'web_anon' does not exist"
Run the role creation commands from the initialization script.

### Error: "permission denied"
Check that you've granted the necessary permissions to `web_anon`:
```sql
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'api';
```

## Automation Options

To automate database initialization in the future:

1. **Use a migration tool**:
   - [dbmate](https://github.com/amacneil/dbmate)
   - [Flyway](https://flywaydb.org/)
   - [Liquibase](https://www.liquibase.org/)

2. **Create a one-time job**: Use App Platform jobs to run initialization:
   ```yaml
   jobs:
     - name: db-init
       kind: PRE_DEPLOY
       instance_size_slug: apps-s-1vcpu-1gb
       github:
         repo: your/repo
         branch: main
       run_command: psql $DATABASE_URL < config/init.sql
   ```

3. **Use Terraform**: Automate database and schema setup with Infrastructure as Code

## Next Steps

- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Customize your schema in `config/init.sql`
- Implement JWT authentication for production use
- Set up database backups

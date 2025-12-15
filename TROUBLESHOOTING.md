# Troubleshooting Guide

Common issues and solutions for PostgREST on DigitalOcean App Platform.

## Deployment Issues

### App fails to deploy

**Symptoms**: Build or deployment fails in App Platform

**Common Causes**:

1. **Invalid app.yaml syntax**
   - Check YAML indentation
   - Validate with `doctl apps propose --spec .do/app.yaml`

2. **Database connection issues**
   - Verify database is created and running
   - Check `PGRST_DB_URI` environment variable reference

3. **Docker build failures**
   - Review build logs in App Platform console
   - Test locally: `docker build -t postgrest-test .`

**Solution**: Check App Platform logs:
```bash
doctl apps logs <app-id> --type build
doctl apps logs <app-id> --type run
```

### Health checks failing

**Symptoms**: App shows as unhealthy in App Platform

**Possible Causes**:
- PostgREST not starting
- Database connection timeout
- Wrong health check path

**Solution**:

1. Check runtime logs:
   ```bash
   doctl apps logs <app-id> --type run --follow
   ```

2. Verify health check endpoint responds:
   ```bash
   curl https://your-app.ondigitalocean.app/
   ```

3. Adjust health check timing in `.do/app.yaml`:
   ```yaml
   health_check:
     initial_delay_seconds: 60  # Increase if slow startup
     timeout_seconds: 5
   ```

## Database Connection Issues

### "Connection refused" error

**Symptoms**: PostgREST logs show database connection refused

**Causes**:
- Database not fully initialized
- Incorrect DATABASE_URL format
- Network connectivity issues

**Solution**:

1. Verify database status in App Platform console

2. Check database connection string format:
   ```
   postgres://username:password@host:port/database
   ```

3. Test database connectivity:
   ```bash
   doctl databases connection <database-id>
   ```

### "Role does not exist" error

**Symptoms**: Error about `web_anon` role not found

**Cause**: Database initialization script didn't run or failed

**Solution**:

1. Connect to database:
   ```bash
   doctl databases db shell <database-id>
   ```

2. Manually create role:
   ```sql
   CREATE ROLE web_anon NOLOGIN;
   GRANT USAGE ON SCHEMA api TO web_anon;
   ```

3. For App Platform managed databases, run init script manually

### "Schema does not exist" error

**Symptoms**: PostgREST can't find `api` schema

**Solution**:

1. Connect to database and create schema:
   ```sql
   CREATE SCHEMA IF NOT EXISTS api;
   GRANT USAGE ON SCHEMA api TO web_anon;
   ```

2. Verify schema exists:
   ```sql
   SELECT schema_name FROM information_schema.schemata;
   ```

## API Request Issues

### Empty response or "[]" returned

**Symptoms**: API calls return empty arrays

**Causes**:
- No data in tables
- Permission issues
- Wrong schema exposed

**Solution**:

1. Verify data exists:
   ```sql
   SELECT * FROM api.todos;
   ```

2. Check permissions:
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.table_privileges
   WHERE table_schema = 'api';
   ```

3. Ensure role has SELECT permission:
   ```sql
   GRANT SELECT ON api.todos TO web_anon;
   ```

### "Forbidden" or 403 errors

**Symptoms**: API returns 403 Forbidden

**Causes**:
- Missing permissions for `web_anon` role
- Row-Level Security (RLS) policies blocking access

**Solution**:

1. Grant necessary permissions:
   ```sql
   GRANT SELECT, INSERT, UPDATE, DELETE ON api.todos TO web_anon;
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'api';
   ```

3. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE api.todos DISABLE ROW LEVEL SECURITY;
   ```

### "404 Not Found" errors

**Symptoms**: Endpoint returns 404

**Causes**:
- Table/view doesn't exist in exposed schema
- Wrong endpoint path

**Solution**:

1. List available endpoints at root: `curl https://your-app.ondigitalocean.app/`

2. Verify table exists in correct schema:
   ```sql
   \dt api.*
   ```

3. Check `PGRST_DB_SCHEMAS` environment variable

## Performance Issues

### Slow API responses

**Symptoms**: Requests take a long time

**Causes**:
- Missing database indexes
- Inefficient queries
- Too many connections

**Solution**:

1. Add indexes to frequently queried columns:
   ```sql
   CREATE INDEX idx_todos_created_at ON api.todos(created_at);
   ```

2. Monitor database performance in App Platform

3. Increase connection pool size:
   ```yaml
   envs:
     - key: PGRST_DB_POOL
       value: "20"
   ```

### High memory usage

**Symptoms**: App platform shows high memory usage

**Solution**:

1. Limit max rows returned:
   ```yaml
   envs:
     - key: PGRST_DB_MAX_ROWS
       value: "1000"
   ```

2. Consider upgrading instance size in `.do/app.yaml`:
   ```yaml
   instance_size_slug: apps-s-2vcpu-2gb
   ```

## Configuration Issues

### Environment variables not working

**Symptoms**: Configuration changes have no effect

**Solution**:

1. Environment variables override config file settings
2. Redeploy app after changing environment variables
3. Verify format: PostgREST uses `PGRST_` prefix

### OpenAPI documentation not showing

**Symptoms**: Root endpoint returns error instead of OpenAPI schema

**Solution**:

1. Ensure `openapi-mode` is not disabled:
   ```yaml
   envs:
     - key: PGRST_OPENAPI_MODE
       value: "follow-privileges"
   ```

2. Check if `web_anon` has permissions on schema

## Getting More Help

### Enable Debug Logging

Set log level to debug for detailed information:

```yaml
envs:
  - key: PGRST_LOG_LEVEL
    value: "debug"
```

View logs:
```bash
doctl apps logs <app-id> --type run --follow
```

### Useful Diagnostic Commands

**Check app status**:
```bash
doctl apps get <app-id>
```

**View recent logs**:
```bash
doctl apps logs <app-id> --type run --tail 100
```

**Database connection test**:
```bash
doctl databases db shell <database-id>
```

### Additional Resources

- [PostgREST Error Messages](https://postgrest.org/en/stable/references/errors.html)
- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Community Forums](https://www.digitalocean.com/community)

### Still Having Issues?

1. Check [GitHub Issues](https://github.com/AppPlatform-Templates/postgrest-appplatform/issues)
2. Ask on [DigitalOcean Community](https://www.digitalocean.com/community)
3. Contact [DigitalOcean Support](https://www.digitalocean.com/support/)

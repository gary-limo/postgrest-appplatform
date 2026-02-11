-- PostgREST Production Database Initialization Script
--
-- ⚠️  IMPORTANT: This script is for PRODUCTION databases only
--
-- 🔒 SECURITY:
--   - Uses dedicated 'api' schema (not public)
--   - anon role is READ-ONLY
--   - Fails loudly if roles cannot be created
--
-- 📚  Learn more: https://postgrest.org/en/stable/tutorials/tut1.html

-- Create dedicated schema for API
CREATE SCHEMA IF NOT EXISTS api;

-- Create anon role for API access
-- IMPORTANT: This will fail if the database user doesn't have role creation privileges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
    RAISE NOTICE 'Created role: anon';
  ELSE
    RAISE NOTICE 'Role anon already exists';
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE EXCEPTION 'SECURITY ERROR: Cannot create anon role. Production databases require custom roles for security. Check that your database user has CREATEROLE privilege.';
END $$;

-- =============================================================================
-- H1B LCA Data Table
-- Source: h1b.csv (~451K records)
-- =============================================================================
CREATE TABLE IF NOT EXISTS api.h1b_lca_data (
  id SERIAL PRIMARY KEY,
  sq_nm INTEGER,
  job_title TEXT,
  soc_code VARCHAR(20),
  soc_title TEXT,
  employer_name TEXT,
  employer_address TEXT,
  worksite_address TEXT,
  wage_rate_of_pay_from NUMERIC(12,2),
  wage_rate_of_pay_to NUMERIC(12,2),
  prevailing_wage NUMERIC(12,2),
  pw_wage_level VARCHAR(10)
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_h1b_employer_name ON api.h1b_lca_data (employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_job_title ON api.h1b_lca_data (job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_soc_code ON api.h1b_lca_data (soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_wage_from ON api.h1b_lca_data (wage_rate_of_pay_from);

-- H1B stats view (accessible at /h1b_lca_stats)
CREATE OR REPLACE VIEW api.h1b_lca_stats AS
  SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT job_title) as unique_job_titles,
    ROUND(AVG(wage_rate_of_pay_from), 2) as avg_wage_from,
    ROUND(MIN(wage_rate_of_pay_from), 2) as min_wage_from,
    ROUND(MAX(wage_rate_of_pay_from), 2) as max_wage_from
  FROM api.h1b_lca_data;

-- =============================================================================
-- Autocomplete suggestion views (DISTINCT values for fast typeahead)
-- Normalized with TRIM/UPPER to eliminate trailing-space and case duplicates.
-- Includes filing_count so results can be sorted by popularity (most filings first).
-- =============================================================================
CREATE OR REPLACE VIEW api.h1b_distinct_employers AS
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         COUNT(*) as filing_count
  FROM api.h1b_lca_data
  WHERE employer_name IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name));

CREATE OR REPLACE VIEW api.h1b_distinct_jobs AS
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         TRIM(job_title) as job_title,
         COUNT(*) as filing_count
  FROM api.h1b_lca_data
  WHERE job_title IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name)), TRIM(job_title);

CREATE OR REPLACE VIEW api.h1b_distinct_locations AS
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         TRIM(worksite_address) as worksite_address,
         COUNT(*) as filing_count
  FROM api.h1b_lca_data
  WHERE worksite_address IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name)), TRIM(worksite_address);

-- Grant permissions to anon role (READ-ONLY access)
GRANT USAGE ON SCHEMA api TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO anon;
-- DISABLED: Write permissions (uncomment to re-enable POST, PATCH, DELETE)
-- GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO anon;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO anon;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT ON TABLES TO anon;
-- DISABLED: Write permissions for future tables (uncomment to re-enable)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT INSERT, UPDATE, DELETE ON TABLES TO anon;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✓ Production database initialized successfully!';
  RAISE NOTICE '✓ Schema created: api';
  RAISE NOTICE '✓ Role created: anon (READ-ONLY access)';
  RAISE NOTICE '✓ Tables: api.h1b_lca_data';
  RAISE NOTICE '✓ Views: api.h1b_lca_stats, api.h1b_distinct_employers, api.h1b_distinct_jobs, api.h1b_distinct_locations';
  RAISE NOTICE '✓ Permissions: anon role has SELECT-only on api schema';
  RAISE NOTICE '';
  RAISE NOTICE 'Available endpoints (READ-ONLY):';
  RAISE NOTICE '  GET /h1b_lca_data - H1B LCA data (~451K records)';
  RAISE NOTICE '  GET /h1b_lca_stats - H1B aggregate statistics';
  RAISE NOTICE '  GET /h1b_distinct_employers - Distinct employer names';
  RAISE NOTICE '  GET /h1b_distinct_jobs - Distinct job titles per employer';
  RAISE NOTICE '  GET /h1b_distinct_locations - Distinct locations per employer';
  RAISE NOTICE '  GET / - Full OpenAPI documentation';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SECURITY: POST, PATCH, DELETE are DISABLED.';
  RAISE NOTICE '   Write permissions are commented out in this script.';
END $$;

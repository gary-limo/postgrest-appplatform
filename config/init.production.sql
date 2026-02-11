-- PostgREST Production Database Initialization Script
--
-- IMPORTANT: This script is for PRODUCTION databases only
--
-- SECURITY:
--   - Uses dedicated 'api' schema (not public)
--   - anon role is READ-ONLY
--   - Fails loudly if roles cannot be created
--
-- PERFORMANCE NOTE:
--    Derived tables (h1b_lca_stats, h1b_distinct_*, h1b_state_stats) are
--    pre-computed tables, NOT views. They are populated once after data load
--    (see load_h1b_data_production.sql) so every API call reads from a ready
--    table instead of running expensive aggregations on 451K rows.
--
-- Learn more: https://postgrest.org/en/stable/tutorials/tut1.html

-- Create dedicated schema for API
CREATE SCHEMA IF NOT EXISTS api;

-- Enable trigram extension for fast ILIKE pattern matching on text columns
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create anon role for API access
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
-- SOURCE TABLE: H1B LCA Data
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

CREATE INDEX IF NOT EXISTS idx_h1b_employer_name ON api.h1b_lca_data (employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_job_title ON api.h1b_lca_data (job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_soc_code ON api.h1b_lca_data (soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_wage_from ON api.h1b_lca_data (wage_rate_of_pay_from);

-- =============================================================================
-- Drop legacy views (transition from views to pre-computed tables)
-- =============================================================================
DROP VIEW IF EXISTS api.h1b_lca_stats CASCADE;
DROP VIEW IF EXISTS api.h1b_distinct_employers CASCADE;
DROP VIEW IF EXISTS api.h1b_distinct_jobs CASCADE;
DROP VIEW IF EXISTS api.h1b_distinct_locations CASCADE;
DROP VIEW IF EXISTS api.h1b_state_stats CASCADE;

-- =============================================================================
-- DERIVED TABLE: Aggregate statistics (1 row)
-- Endpoint: GET /h1b_lca_stats
-- =============================================================================
CREATE TABLE IF NOT EXISTS api.h1b_lca_stats (
  total_records BIGINT,
  unique_employers BIGINT,
  unique_job_titles BIGINT,
  avg_wage_from NUMERIC(12,2),
  min_wage_from NUMERIC(12,2),
  max_wage_from NUMERIC(12,2)
);

-- =============================================================================
-- DERIVED TABLE: Distinct employers with filing counts
-- Endpoint: GET /h1b_distinct_employers
-- =============================================================================
CREATE TABLE IF NOT EXISTS api.h1b_distinct_employers (
  employer_name TEXT,
  filing_count BIGINT
);

CREATE INDEX IF NOT EXISTS idx_de_name ON api.h1b_distinct_employers USING gin (employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_de_count ON api.h1b_distinct_employers (filing_count DESC);

-- =============================================================================
-- DERIVED TABLE: Distinct job titles per employer
-- Endpoint: GET /h1b_distinct_jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS api.h1b_distinct_jobs (
  employer_name TEXT,
  job_title TEXT,
  filing_count BIGINT
);

CREATE INDEX IF NOT EXISTS idx_dj_emp ON api.h1b_distinct_jobs USING gin (employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dj_title ON api.h1b_distinct_jobs USING gin (job_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dj_count ON api.h1b_distinct_jobs (filing_count DESC);

-- =============================================================================
-- DERIVED TABLE: Distinct locations per employer
-- Endpoint: GET /h1b_distinct_locations
-- =============================================================================
CREATE TABLE IF NOT EXISTS api.h1b_distinct_locations (
  employer_name TEXT,
  worksite_address TEXT,
  filing_count BIGINT
);

CREATE INDEX IF NOT EXISTS idx_dl_emp ON api.h1b_distinct_locations USING gin (employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dl_addr ON api.h1b_distinct_locations USING gin (worksite_address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dl_count ON api.h1b_distinct_locations (filing_count DESC);

-- =============================================================================
-- DERIVED TABLE: State-level aggregation (for the map dashboard)
-- Endpoint: GET /h1b_state_stats
-- =============================================================================
CREATE TABLE IF NOT EXISTS api.h1b_state_stats (
  state_code VARCHAR(2),
  filing_count BIGINT,
  employer_count BIGINT,
  avg_wage NUMERIC(12,0)
);

CREATE INDEX IF NOT EXISTS idx_ss_code ON api.h1b_state_stats (state_code);
CREATE INDEX IF NOT EXISTS idx_ss_count ON api.h1b_state_stats (filing_count DESC);

-- =============================================================================
-- Grant permissions to anon role (READ-ONLY access)
-- =============================================================================
GRANT USAGE ON SCHEMA api TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO anon;

-- Ensure future tables also get read permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT ON TABLES TO anon;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Production database initialized successfully!';
  RAISE NOTICE 'Schema: api';
  RAISE NOTICE 'Role: anon (READ-ONLY)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created (all pre-computed, no views):';
  RAISE NOTICE '  api.h1b_lca_data           - Source table (~451K records)';
  RAISE NOTICE '  api.h1b_lca_stats          - Aggregate statistics (1 row)';
  RAISE NOTICE '  api.h1b_distinct_employers - Distinct employers with counts';
  RAISE NOTICE '  api.h1b_distinct_jobs      - Distinct jobs per employer';
  RAISE NOTICE '  api.h1b_distinct_locations - Distinct locations per employer';
  RAISE NOTICE '  api.h1b_state_stats        - State-level filing aggregation';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Load data and populate derived tables:';
  RAISE NOTICE '  psql -f config/load_h1b_data_production.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'POST, PATCH, DELETE are DISABLED.';
END $$;

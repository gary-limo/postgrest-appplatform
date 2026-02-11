-- PostgREST Database Initialization Script
--
-- IMPORTANT: This script runs AUTOMATICALLY on every deployment via App Platform jobs
--
-- CUSTOMIZE THIS SCRIPT:
--   - All tables are created in the 'public' schema (default for App Platform dev databases)
--   - This script is idempotent - safe to run multiple times
--
-- Learn more: https://postgrest.org/en/stable/tutorials/tut0.html
--
-- NOTE: App Platform dev databases don't allow creating custom schemas or roles.
--    We use the 'public' schema and the default database user instead.
--
-- PERFORMANCE NOTE:
--    Derived tables (h1b_lca_stats, h1b_distinct_*, h1b_state_stats) are
--    pre-computed tables, NOT views. They are populated once after data load
--    (see load_h1b_data.sql) so every API call reads from a ready table
--    instead of running expensive aggregations on 451K rows.

-- Enable trigram extension for fast ILIKE pattern matching on text columns
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- SOURCE TABLE: H1B LCA Data
-- Source: h1b.csv (~451K records)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.h1b_lca_data (
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

CREATE INDEX IF NOT EXISTS idx_h1b_employer_name ON public.h1b_lca_data (employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_job_title ON public.h1b_lca_data (job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_soc_code ON public.h1b_lca_data (soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_wage_from ON public.h1b_lca_data (wage_rate_of_pay_from);

-- =============================================================================
-- Drop legacy views (transition from views to pre-computed tables)
-- Safe to run even if views don't exist
-- =============================================================================
DROP VIEW IF EXISTS public.h1b_lca_stats CASCADE;
DROP VIEW IF EXISTS public.h1b_distinct_employers CASCADE;
DROP VIEW IF EXISTS public.h1b_distinct_jobs CASCADE;
DROP VIEW IF EXISTS public.h1b_distinct_locations CASCADE;
DROP VIEW IF EXISTS public.h1b_state_stats CASCADE;

-- =============================================================================
-- DERIVED TABLE: Aggregate statistics (1 row)
-- Endpoint: GET /h1b_lca_stats
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.h1b_lca_stats (
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
-- Used for autocomplete suggestions sorted by popularity
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.h1b_distinct_employers (
  employer_name TEXT,
  filing_count BIGINT
);

CREATE INDEX IF NOT EXISTS idx_de_name ON public.h1b_distinct_employers USING gin (employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_de_count ON public.h1b_distinct_employers (filing_count DESC);

-- =============================================================================
-- DERIVED TABLE: Distinct job titles per employer
-- Endpoint: GET /h1b_distinct_jobs
-- Used for employer-scoped role suggestions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.h1b_distinct_jobs (
  employer_name TEXT,
  job_title TEXT,
  filing_count BIGINT
);

CREATE INDEX IF NOT EXISTS idx_dj_emp ON public.h1b_distinct_jobs USING gin (employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dj_title ON public.h1b_distinct_jobs USING gin (job_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dj_count ON public.h1b_distinct_jobs (filing_count DESC);

-- =============================================================================
-- DERIVED TABLE: Distinct locations per employer
-- Endpoint: GET /h1b_distinct_locations
-- Used for employer-scoped location suggestions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.h1b_distinct_locations (
  employer_name TEXT,
  worksite_address TEXT,
  filing_count BIGINT
);

CREATE INDEX IF NOT EXISTS idx_dl_emp ON public.h1b_distinct_locations USING gin (employer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dl_addr ON public.h1b_distinct_locations USING gin (worksite_address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dl_count ON public.h1b_distinct_locations (filing_count DESC);

-- =============================================================================
-- DERIVED TABLE: State-level aggregation (for the map dashboard)
-- Endpoint: GET /h1b_state_stats
-- State code extracted from worksite_address via regex (2-letter code before ZIP)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.h1b_state_stats (
  state_code VARCHAR(2),
  filing_count BIGINT,
  employer_count BIGINT,
  avg_wage NUMERIC(12,0)
);

CREATE INDEX IF NOT EXISTS idx_ss_code ON public.h1b_state_stats (state_code);
CREATE INDEX IF NOT EXISTS idx_ss_count ON public.h1b_state_stats (filing_count DESC);

-- =============================================================================
-- SECURITY: Revoke write permissions to disable POST, PATCH, DELETE
-- =============================================================================
REVOKE INSERT, UPDATE, DELETE ON public.h1b_lca_data FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.h1b_lca_stats FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.h1b_distinct_employers FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.h1b_distinct_jobs FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.h1b_distinct_locations FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.h1b_state_stats FROM PUBLIC;
REVOKE USAGE ON public.h1b_lca_data_id_seq FROM PUBLIC;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'PostgREST database initialized successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created (all pre-computed, no views):';
  RAISE NOTICE '  h1b_lca_data           - Source table (~451K records)';
  RAISE NOTICE '  h1b_lca_stats          - Aggregate statistics (1 row)';
  RAISE NOTICE '  h1b_distinct_employers - Distinct employers with counts';
  RAISE NOTICE '  h1b_distinct_jobs      - Distinct jobs per employer';
  RAISE NOTICE '  h1b_distinct_locations - Distinct locations per employer';
  RAISE NOTICE '  h1b_state_stats        - State-level filing aggregation';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Load data and populate derived tables:';
  RAISE NOTICE '  psql -f config/load_h1b_data.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'POST, PATCH, DELETE are DISABLED.';
END $$;

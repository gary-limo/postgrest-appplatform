-- PostgREST Database Initialization Script
--
-- ⚠️  IMPORTANT: This script runs AUTOMATICALLY on every deployment via App Platform jobs
--
-- ✏️  CUSTOMIZE THIS SCRIPT:
--   - All tables/views are created in the 'public' schema (default for App Platform dev databases)
--   - This script is idempotent - safe to run multiple times
--
-- 📚  Learn more: https://postgrest.org/en/stable/tutorials/tut0.html
--
-- 💡 NOTE: App Platform dev databases don't allow creating custom schemas or roles.
--    We use the 'public' schema and the default database user instead.

-- =============================================================================
-- H1B LCA Data Table
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

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_h1b_employer_name ON public.h1b_lca_data (employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_job_title ON public.h1b_lca_data (job_title);
CREATE INDEX IF NOT EXISTS idx_h1b_soc_code ON public.h1b_lca_data (soc_code);
CREATE INDEX IF NOT EXISTS idx_h1b_wage_from ON public.h1b_lca_data (wage_rate_of_pay_from);

-- H1B stats view (accessible at /h1b_lca_stats)
CREATE OR REPLACE VIEW public.h1b_lca_stats AS
  SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT job_title) as unique_job_titles,
    ROUND(AVG(wage_rate_of_pay_from), 2) as avg_wage_from,
    ROUND(MIN(wage_rate_of_pay_from), 2) as min_wage_from,
    ROUND(MAX(wage_rate_of_pay_from), 2) as max_wage_from
  FROM public.h1b_lca_data;

-- =============================================================================
-- Autocomplete suggestion views (DISTINCT values for fast typeahead)
-- Normalized with TRIM/UPPER to eliminate trailing-space and case duplicates.
-- Includes filing_count so results can be sorted by popularity (most filings first).
-- =============================================================================
CREATE OR REPLACE VIEW public.h1b_distinct_employers AS
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         COUNT(*) as filing_count
  FROM public.h1b_lca_data
  WHERE employer_name IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name));

CREATE OR REPLACE VIEW public.h1b_distinct_jobs AS
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         TRIM(job_title) as job_title,
         COUNT(*) as filing_count
  FROM public.h1b_lca_data
  WHERE job_title IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name)), TRIM(job_title);

CREATE OR REPLACE VIEW public.h1b_distinct_locations AS
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         TRIM(worksite_address) as worksite_address,
         COUNT(*) as filing_count
  FROM public.h1b_lca_data
  WHERE worksite_address IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name)), TRIM(worksite_address);

-- 🔒 SECURITY: Revoke write permissions to disable POST, PATCH, DELETE
REVOKE INSERT, UPDATE, DELETE ON public.h1b_lca_data FROM PUBLIC;
REVOKE USAGE ON public.h1b_lca_data_id_seq FROM PUBLIC;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'PostgREST database initialized successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Available endpoints (READ-ONLY):';
  RAISE NOTICE '  GET /h1b_lca_data - H1B LCA data (~451K records)';
  RAISE NOTICE '  GET /h1b_lca_stats - H1B aggregate statistics';
  RAISE NOTICE '  GET /h1b_distinct_employers - Distinct employer names';
  RAISE NOTICE '  GET /h1b_distinct_jobs - Distinct job titles per employer';
  RAISE NOTICE '  GET /h1b_distinct_locations - Distinct locations per employer';
  RAISE NOTICE '  GET / - Full OpenAPI documentation';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 POST, PATCH, DELETE are DISABLED.';
END $$;

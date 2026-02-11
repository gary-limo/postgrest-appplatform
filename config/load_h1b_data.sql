-- =============================================================================
-- H1B LCA Data Loader + Derived Table Population
-- =============================================================================
-- This script:
--   1. Loads h1b.csv into h1b_lca_data (source table)
--   2. Populates all derived tables (pre-computed aggregations)
--
-- USAGE (Local / Development):
--   psql -h localhost -U postgres -d postgres -f config/load_h1b_data.sql
--
-- USAGE (DigitalOcean App Platform - connect to managed DB):
--   psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" \
--     -f config/load_h1b_data.sql
--
-- NOTE: The \copy command runs client-side, so the CSV file must be on the
-- machine running psql (not on the database server).
-- =============================================================================

-- =============================================
-- STEP 1: Load source data
-- =============================================
TRUNCATE public.h1b_lca_data RESTART IDENTITY;

\copy public.h1b_lca_data (sq_nm, job_title, soc_code, soc_title, employer_name, employer_address, worksite_address, wage_rate_of_pay_from, wage_rate_of_pay_to, prevailing_wage, pw_wage_level) FROM 'h1b.csv' WITH (FORMAT csv, HEADER true, NULL '');

SELECT COUNT(*) as rows_loaded FROM public.h1b_lca_data;

-- =============================================
-- STEP 2: Populate derived tables
-- These are the same aggregation queries that
-- were previously in views, now stored as tables
-- for instant API reads.
-- =============================================

-- h1b_lca_stats: Aggregate statistics (1 row)
TRUNCATE public.h1b_lca_stats;
INSERT INTO public.h1b_lca_stats
  SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT employer_name) as unique_employers,
    COUNT(DISTINCT job_title) as unique_job_titles,
    ROUND(AVG(wage_rate_of_pay_from), 2) as avg_wage_from,
    ROUND(MIN(wage_rate_of_pay_from), 2) as min_wage_from,
    ROUND(MAX(wage_rate_of_pay_from), 2) as max_wage_from
  FROM public.h1b_lca_data;

-- h1b_distinct_employers: Unique employers with filing counts
TRUNCATE public.h1b_distinct_employers;
INSERT INTO public.h1b_distinct_employers
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         COUNT(*) as filing_count
  FROM public.h1b_lca_data
  WHERE employer_name IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name));

-- h1b_distinct_jobs: Unique job titles per employer
TRUNCATE public.h1b_distinct_jobs;
INSERT INTO public.h1b_distinct_jobs
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         TRIM(job_title) as job_title,
         COUNT(*) as filing_count
  FROM public.h1b_lca_data
  WHERE job_title IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name)), TRIM(job_title);

-- h1b_distinct_locations: Unique locations per employer
TRUNCATE public.h1b_distinct_locations;
INSERT INTO public.h1b_distinct_locations
  SELECT UPPER(TRIM(employer_name)) as employer_name,
         TRIM(worksite_address) as worksite_address,
         COUNT(*) as filing_count
  FROM public.h1b_lca_data
  WHERE worksite_address IS NOT NULL
  GROUP BY UPPER(TRIM(employer_name)), TRIM(worksite_address);

-- h1b_state_stats: State-level aggregation
TRUNCATE public.h1b_state_stats;
INSERT INTO public.h1b_state_stats
  WITH extracted AS (
    SELECT
      UPPER(SUBSTRING(worksite_address FROM '([A-Za-z]{2})\s+\d{5}')) as state_code,
      employer_name,
      wage_rate_of_pay_from
    FROM public.h1b_lca_data
    WHERE worksite_address IS NOT NULL
  )
  SELECT
    state_code,
    COUNT(*) as filing_count,
    COUNT(DISTINCT UPPER(TRIM(employer_name))) as employer_count,
    ROUND(AVG(wage_rate_of_pay_from), 0) as avg_wage
  FROM extracted
  WHERE state_code IN (
    'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL',
    'GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
    'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
    'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI',
    'SC','SD','TN','TX','UT','VT','VA','WA','WV','WI',
    'WY','PR','GU','VI'
  )
  GROUP BY state_code;

-- =============================================
-- STEP 3: Verify
-- =============================================
SELECT 'h1b_lca_data' as table_name, COUNT(*) as row_count FROM public.h1b_lca_data
UNION ALL
SELECT 'h1b_lca_stats', COUNT(*) FROM public.h1b_lca_stats
UNION ALL
SELECT 'h1b_distinct_employers', COUNT(*) FROM public.h1b_distinct_employers
UNION ALL
SELECT 'h1b_distinct_jobs', COUNT(*) FROM public.h1b_distinct_jobs
UNION ALL
SELECT 'h1b_distinct_locations', COUNT(*) FROM public.h1b_distinct_locations
UNION ALL
SELECT 'h1b_state_stats', COUNT(*) FROM public.h1b_state_stats;

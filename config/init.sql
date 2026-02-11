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
-- DISABLED: Todo-related tables and views (commented out)
-- =============================================================================
-- CREATE TABLE IF NOT EXISTS public.todos (
--   id SERIAL PRIMARY KEY,
--   title TEXT NOT NULL,
--   completed BOOLEAN DEFAULT FALSE,
--   created_at TIMESTAMP DEFAULT NOW()
-- );
--
-- INSERT INTO public.todos (title, completed)
-- SELECT * FROM (VALUES
--   ('Learn PostgREST', false),
--   ('Deploy to App Platform', false),
--   ('Build amazing APIs', false)
-- ) AS v
-- WHERE NOT EXISTS (SELECT 1 FROM public.todos);
--
-- CREATE OR REPLACE VIEW public.todos_stats AS
--   SELECT
--     COUNT(*) as total,
--     COUNT(*) FILTER (WHERE completed) as completed_count,
--     COUNT(*) FILTER (WHERE NOT completed) as pending_count
--   FROM public.todos;
--
-- CREATE OR REPLACE VIEW public.welcome AS
--   SELECT
--     'Welcome to PostgREST API'::text as message,
--     'PostgREST 12.2.3'::text as version,
--     json_build_object(
--       'todos', '/todos',
--       'stats', '/todos_stats',
--       'welcome', '/welcome',
--       'openapi', '/'
--     ) as endpoints,
--     json_build_object(
--       'list_all', 'curl https://your-app.ondigitalocean.app/todos',
--       'get_stats', 'curl https://your-app.ondigitalocean.app/todos_stats',
--       'filter', 'curl https://your-app.ondigitalocean.app/todos?completed=eq.false',
--       'sort_limit', 'curl https://your-app.ondigitalocean.app/todos?order=id.desc&limit=5'
--     ) as examples,
--     'https://postgrest.org'::text as docs;
-- =============================================================================

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
  RAISE NOTICE '  GET / - Full OpenAPI documentation';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 POST, PATCH, DELETE are DISABLED.';
END $$;

-- =============================================================================
-- H1B LCA Data Loader (Production - api schema)
-- =============================================================================
-- This script loads data from h1b.csv into the api.h1b_lca_data table.
--
-- USAGE (DigitalOcean App Platform - connect to managed DB):
--   psql "postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" \
--     -f config/load_h1b_data_production.sql
--
-- NOTE: The \copy command runs client-side, so the CSV file must be on the
-- machine running psql (not on the database server).
-- =============================================================================

-- Clear existing data to prevent duplicates on re-run
TRUNCATE api.h1b_lca_data RESTART IDENTITY;

-- Load CSV data using \copy (client-side COPY command)
-- Adjust the path to h1b.csv if needed
\copy api.h1b_lca_data (sq_nm, job_title, soc_code, soc_title, employer_name, employer_address, worksite_address, wage_rate_of_pay_from, wage_rate_of_pay_to, prevailing_wage, pw_wage_level) FROM 'h1b.csv' WITH (FORMAT csv, HEADER true, NULL '');

-- Verify the load
SELECT COUNT(*) as rows_loaded FROM api.h1b_lca_data;
SELECT * FROM api.h1b_lca_data LIMIT 5;

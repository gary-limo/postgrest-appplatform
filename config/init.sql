-- PostgREST Database Initialization Script
--
-- ⚠️  IMPORTANT: This script runs AUTOMATICALLY on every deployment via App Platform jobs
--
-- What this script does:
--   1. Creates an 'api' schema for your database tables/views
--   2. Creates a 'web_anon' role for anonymous API access
--   3. Creates a sample 'todos' table with example data
--   4. Creates a 'todos_stats' view for aggregated statistics
--
-- ✏️  CUSTOMIZE THIS SCRIPT:
--   - Edit this file to add your own tables, views, and functions
--   - Remove or modify the sample 'todos' table as needed
--   - Keep the schema and role setup (lines 14-23) for PostgREST to work
--   - This script is idempotent - safe to run multiple times
--
-- 📚  Learn more: https://postgrest.org/en/stable/tutorials/tut0.html

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

-- Grant select and insert permissions to web_anon
GRANT SELECT, INSERT, UPDATE, DELETE ON api.todos TO web_anon;
GRANT USAGE, SELECT ON SEQUENCE api.todos_id_seq TO web_anon;

-- Insert sample data
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

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'PostgREST database initialized successfully!';
  RAISE NOTICE 'Sample table: api.todos';
  RAISE NOTICE 'Sample view: api.todos_stats';
END $$;

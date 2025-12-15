-- PostgREST Database Initialization Script
--
-- ⚠️  IMPORTANT: This script runs AUTOMATICALLY on every deployment via App Platform jobs
--
-- What this script does:
--   1. Creates a sample 'todos' table in the public schema
--   2. Creates a 'todos_stats' view for aggregated statistics
--   3. Inserts sample data to test the API immediately
--
-- ✏️  CUSTOMIZE THIS SCRIPT:
--   - Edit this file to add your own tables, views, and functions
--   - Remove or modify the sample 'todos' table as needed
--   - All tables/views are created in the 'public' schema (default for App Platform dev databases)
--   - This script is idempotent - safe to run multiple times
--
-- 📚  Learn more: https://postgrest.org/en/stable/tutorials/tut0.html
--
-- 💡 NOTE: App Platform dev databases don't allow creating custom schemas or roles.
--    We use the 'public' schema and the default database user instead.

-- Create a sample table in the public schema
CREATE TABLE IF NOT EXISTS public.todos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data (idempotent - won't create duplicates)
INSERT INTO public.todos (title, completed) VALUES
  ('Learn PostgREST', false),
  ('Deploy to App Platform', false),
  ('Build amazing APIs', false)
ON CONFLICT DO NOTHING;

-- Create a sample view
CREATE OR REPLACE VIEW public.todos_stats AS
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE completed) as completed_count,
    COUNT(*) FILTER (WHERE NOT completed) as pending_count
  FROM public.todos;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'PostgREST database initialized successfully!';
  RAISE NOTICE 'Sample table: public.todos';
  RAISE NOTICE 'Sample view: public.todos_stats';
  RAISE NOTICE 'Test your API at: /todos and /todos_stats';
END $$;

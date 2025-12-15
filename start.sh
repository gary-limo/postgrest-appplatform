#!/bin/sh
set -e

echo "Starting PostgREST..."
echo "Database URI: ${PGRST_DB_URI:-not set}"
echo "Database Schema: ${PGRST_DB_SCHEMAS:-public}"
echo "Server Port: ${PGRST_SERVER_PORT:-3000}"

# Start PostgREST with configuration
exec postgrest /config/postgrest.conf

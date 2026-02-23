#!/bin/sh
set -e

echo "=== Results Tracking System Starting ==="

# Load environment variables from .env file (if present)
# Only sets vars that are NOT already defined (preserves Cloud Run env vars)
if [ -f packages/api/.env ]; then
  echo "Loading env vars from packages/api/.env (skipping already-set vars)..."
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and blank lines
    case "$line" in
      \#*|"") continue ;;
    esac
    # Extract variable name (everything before first =)
    var_name="${line%%=*}"
    # Only export if not already set in environment
    eval "current_val=\${$var_name+_SET_}"
    if [ -z "$current_val" ]; then
      export "$line"
      echo "  Set $var_name from .env"
    else
      echo "  Skipped $var_name (already set by environment)"
    fi
  done < packages/api/.env
fi

# Optional: Run database migrations before startup
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  node packages/db/dist/migrate.js
  echo "Migrations complete."
fi

# Start the Hono API server in the background
echo "Starting API server on port ${API_PORT:-3002}..."
node packages/api/dist/index.js &
API_PID=$!

# Wait for API to be ready (up to 30 seconds)
echo "Waiting for API health check..."
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:${API_PORT:-3002}/health > /dev/null 2>&1; then
    echo "API is ready."
    break
  fi
  if [ "$i" = "30" ]; then
    echo "ERROR: API failed to start within 30 seconds."
    kill $API_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Start Next.js web server in the foreground
# PORT is set by Cloud Run (defaults to 8080)
echo "Starting Web server on port ${PORT:-8080}..."
HOSTNAME="0.0.0.0" PORT=${PORT:-8080} exec node packages/web/server.js

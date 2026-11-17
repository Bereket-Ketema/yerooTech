#!/usr/bin/env bash
# Start the local PostgreSQL instance for YerooTech SaaS
DATA_DIR="/home/bereketketema/projects/yerooTech/.postgres_data"
LOG_FILE="$DATA_DIR/server.log"

if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "PostgreSQL is already running on localhost:5432."
else
    echo "Starting PostgreSQL..."
    pg_ctl -D "$DATA_DIR" -l "$LOG_FILE" start
    echo "PostgreSQL started successfully on port 5432."
fi

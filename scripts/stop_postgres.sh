#!/usr/bin/env bash
# Stop the local PostgreSQL instance for YerooTech SaaS
DATA_DIR="/home/bereketketema/projects/yerooTech/.postgres_data"

if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "Stopping PostgreSQL..."
    pg_ctl -D "$DATA_DIR" stop
    echo "PostgreSQL stopped."
else
    echo "PostgreSQL is not currently running."
fi

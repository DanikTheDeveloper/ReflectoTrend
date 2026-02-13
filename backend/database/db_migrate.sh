#!/usr/bin/env bash

set -e

if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
else
  echo ".env file not found in parent directory"
  exit 1
fi

required_vars=(DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME DB_SSL_MODE DB_SCHEMA)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Missing environment variable: $var"
    exit 1
  fi
done

export PGPASSWORD="$DB_PASSWORD"

PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

$PSQL -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS $DB_SCHEMA;"

$PSQL -v ON_ERROR_STOP=1 \
  -c "SET search_path TO $DB_SCHEMA;" \
  -f migrations/schema.sql

echo "Deployment complete"

#!/usr/bin/env bash

set -e
set -u

echo "Creating database: ${POSTGRES_TEST_DB}"

psql -v ON_ERROR_STOP=1 <<-EOSQL
    CREATE DATABASE "$POSTGRES_TEST_DB";
EOSQL

psql -l

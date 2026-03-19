#!/bin/sh
echo "📦 Running Postgres migrations..."
pnpm drizzle-kit migrate

echo "📦 Running ClickHouse migrations..."
pnpm clickhouse-migrations migrate --host=http://$CLICKHOUSE_HOST:$CLICKHOUSE_PORT --user=$CLICKHOUSE_USER --password=$CLICKHOUSE_PASSWORD --migrations-home=./migrations/ch --db=$CLICKHOUSE_DB

echo "✅ Starting app..."
exec node dist/index.js
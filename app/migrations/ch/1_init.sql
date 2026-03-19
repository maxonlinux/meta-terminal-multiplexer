-- 
-- ticks table
-- 
CREATE TABLE
    IF NOT EXISTS sim_ticks (
        scenario_id UUID,
        symbol String,
        price Float64,
        volume Float64,
        timestamp DateTime
    ) ENGINE = MergeTree ()
PARTITION BY
    toYYYYMMDD (timestamp)
ORDER BY
    (symbol, timestamp) TTL timestamp + INTERVAL 1 DAY DELETE;

-- 
-- 1m candles table
-- 
CREATE TABLE
    IF NOT EXISTS sim_candles_1m (
        scenario_id UUID,
        symbol String,
        time DateTime,
        open AggregateFunction (argMin, Float64, DateTime),
        high SimpleAggregateFunction (max, Float64),
        low SimpleAggregateFunction (min, Float64),
        close AggregateFunction (argMax, Float64, DateTime),
        volume SimpleAggregateFunction (sum, Float64)
    ) ENGINE = AggregatingMergeTree
ORDER BY
    (scenario_id, symbol, time);

-- 
-- mat view for 1m candles
-- 
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sim_candles_1m TO sim_candles_1m AS
SELECT
    scenario_id,
    symbol,
    toStartOfMinute (timestamp) AS time,
    argMinState (price, timestamp) AS open,
    max(price) AS high,
    min(price) AS low,
    argMaxState (price, timestamp) AS close,
    sum(volume) AS volume
FROM
    sim_ticks
GROUP BY
    scenario_id,
    symbol,
    time;

-- 
-- simulation periods table
-- 
CREATE TABLE
    IF NOT EXISTS sim_periods (
        scenario_id UUID,
        symbol String,
        start_time AggregateFunction (min, DateTime),
        end_time AggregateFunction (max, DateTime),
        tick_count AggregateFunction (count, UInt64)
    ) ENGINE = AggregatingMergeTree ()
ORDER BY
    (symbol, scenario_id);

-- 
--  mat view for simulation periods
-- 
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sim_periods TO sim_periods AS
SELECT
    scenario_id,
    symbol,
    minState (timestamp) AS start_time,
    maxState (timestamp) AS end_time,
    countState () AS tick_count
FROM
    sim_ticks
GROUP BY
    scenario_id,
    symbol;
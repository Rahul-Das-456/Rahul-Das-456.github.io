-- 01_sql_basics.sql: SELECT, WHERE, GROUP BY, ORDER BY.
-- Run: sqlite3 surv.db < 01_sql_basics.sql
.mode column
.headers on

-- 1. Look at the raw tape. Always start here.
SELECT * FROM trades ORDER BY ts LIMIT 5;

-- 2. Filter: big prints only.
SELECT ts, symbol, buy_acct, sell_acct, price, qty
FROM trades
WHERE qty >= 1000
ORDER BY qty DESC
LIMIT 5;

-- 3. Aggregate: who bought the most of each symbol?
SELECT symbol, buy_acct, SUM(qty) AS shares_bought, COUNT(*) AS n_trades
FROM trades
GROUP BY symbol, buy_acct
ORDER BY shares_bought DESC
LIMIT 5;

-- 4. HAVING filters groups. Count-based cancel rate hides a spoofer;
--    share-weighted cancel rate finds one. Compare the two columns.
SELECT account_id,
       COUNT(*) AS n_orders,
       ROUND(AVG(status = 'CANCELLED'), 2) AS cancel_rate_by_count,
       ROUND(1.0 * SUM(CASE WHEN status = 'CANCELLED' THEN qty END) / SUM(qty), 2)
         AS cancel_rate_by_shares
FROM orders
GROUP BY account_id
HAVING cancel_rate_by_shares > 0.5;

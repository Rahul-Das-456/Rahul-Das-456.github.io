-- 02_joins_windows.sql: JOIN and window functions.
-- Run: sqlite3 surv.db < 02_joins_windows.sql
.mode column
.headers on

-- 1. JOIN: tag each trade with the buyer's and seller's owner.
SELECT t.ts, t.buy_acct, b.owner_id AS buy_owner,
       t.sell_acct, s.owner_id AS sell_owner, t.qty
FROM trades t
JOIN accounts b ON b.account_id = t.buy_acct
JOIN accounts s ON s.account_id = t.sell_acct
ORDER BY t.ts
LIMIT 5;

-- 2. LAG: price change from the previous trade in the same symbol.
SELECT ts, symbol, price,
       ROUND(price - LAG(price) OVER (PARTITION BY symbol ORDER BY ts), 2) AS chg
FROM trades
WHERE symbol = 'XYZ'
ORDER BY ts DESC
LIMIT 5;

-- 3. Running SUM: an account's position through the day.
WITH fills AS (
  SELECT ts, symbol, buy_acct AS acct,  qty FROM trades
  UNION ALL
  SELECT ts, symbol, sell_acct AS acct, -qty FROM trades
)
SELECT ts, symbol, qty,
       SUM(qty) OVER (PARTITION BY symbol ORDER BY ts) AS position
FROM fills
WHERE acct = 'A7' AND symbol = 'ABC'
ORDER BY ts
LIMIT 6;

-- 4. RANK: top 3 buyers per symbol.
SELECT * FROM (
  SELECT symbol, buy_acct, SUM(qty) AS shares,
         RANK() OVER (PARTITION BY symbol ORDER BY SUM(qty) DESC) AS rnk
  FROM trades GROUP BY symbol, buy_acct
) WHERE rnk <= 3;

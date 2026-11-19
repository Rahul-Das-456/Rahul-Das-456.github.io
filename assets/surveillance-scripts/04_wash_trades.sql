-- 04_wash_trades.sql: wash trades.
-- Same beneficial owner on both sides means no change in ownership.
-- Run: sqlite3 surv.db < 04_wash_trades.sql
.mode column
.headers on

SELECT b.owner_id,
       t.symbol,
       COUNT(*)              AS n_trades,
       SUM(t.qty)            AS shares,
       MIN(t.ts)             AS first_ts,
       MAX(t.ts)             AS last_ts
FROM trades t
JOIN accounts b ON b.account_id = t.buy_acct
JOIN accounts s ON s.account_id = t.sell_acct
WHERE b.owner_id = s.owner_id          -- the core test
  AND t.buy_acct <> t.sell_acct        -- self-crosses get their own report
GROUP BY b.owner_id, t.symbol
HAVING COUNT(*) >= 3;                  -- one cross can be an accident

-- 06_marking_the_close.sql: marking the close.
-- Who drove the price in the last 10 minutes, and how much did it move?
-- Run: sqlite3 surv.db < 06_marking_close.sql
.mode column
.headers on

WITH last10 AS (
  SELECT * FROM trades
  WHERE time(ts) >= '15:50:00'
),
move AS (                                   -- price change over the window
  SELECT symbol,
         (SELECT price FROM last10 l WHERE l.symbol = x.symbol ORDER BY ts LIMIT 1)      AS open_px,
         (SELECT price FROM last10 l WHERE l.symbol = x.symbol ORDER BY ts DESC LIMIT 1) AS close_px
  FROM (SELECT DISTINCT symbol FROM last10) x
)
SELECT l.symbol, l.buy_acct,
       SUM(l.qty)                                         AS bought,
       ROUND(1.0 * SUM(l.qty) /
             (SELECT SUM(qty) FROM last10 z WHERE z.symbol = l.symbol), 2) AS share_of_vol,
       ROUND(100.0 * (m.close_px - m.open_px) / m.open_px, 2)              AS move_pct
FROM last10 l
JOIN move m ON m.symbol = l.symbol
GROUP BY l.symbol, l.buy_acct
HAVING share_of_vol >= 0.5 AND ABS(move_pct) >= 1.0;

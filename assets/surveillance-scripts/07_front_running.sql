-- 07_front_running.sql: front running.
-- A firm (prop) order, same symbol and side, placed while a large
-- client order was still working.
-- Run: sqlite3 surv.db < 07_front_running.sql
.mode column
.headers on

SELECT c.order_id   AS client_order, c.account_id AS client, c.qty AS client_qty,
       c.ts         AS client_in,    c.end_ts     AS client_done,
       p.account_id AS prop_acct,    p.ts         AS prop_in,  p.qty AS prop_qty,
       CAST(ROUND((julianday(p.ts) - julianday(c.ts)) * 86400) AS INT) AS secs_after
FROM orders c
JOIN accounts ca ON ca.account_id = c.account_id AND ca.acct_type = 'client'
JOIN orders p    ON p.symbol = c.symbol
                AND p.side   = c.side
                AND p.ts     > c.ts            -- prop came in after the client
                AND p.ts     < c.end_ts        -- but before the client finished
JOIN accounts pa ON pa.account_id = p.account_id AND pa.acct_type = 'prop'
WHERE c.qty >= 10000;                           -- "large" client order

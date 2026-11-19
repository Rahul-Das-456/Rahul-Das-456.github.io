# 08_insider.py: insider trading around news.
# Who built a position before the headline, and what did it earn?
import sqlite3
import pandas as pd

con = sqlite3.connect("surv.db")
trades = pd.read_sql("SELECT * FROM trades", con, parse_dates=["ts"])
news = pd.read_sql("SELECT * FROM news", con, parse_dates=["ts"])

LOOKBACK = pd.Timedelta("2h")
rows = []
for _, n in news.iterrows():
    sym = trades[trades["symbol"] == n["symbol"]]
    before = sym[(sym["ts"] < n["ts"]) & (sym["ts"] >= n["ts"] - LOOKBACK)]
    after_px = sym[sym["ts"] > n["ts"]]["price"].mean()

    # Net shares bought per account in the lookback window.
    buys = before.groupby("buy_acct")["qty"].sum()
    sells = before.groupby("sell_acct")["qty"].sum()
    net = buys.sub(sells, fill_value=0)
    cost = (before["price"] * before["qty"]).groupby(before["buy_acct"]).sum()

    for acct, shares in net[net > 0].items():
        avg_px = cost.get(acct, 0) / buys.get(acct, 1)
        rows.append({"symbol": n["symbol"], "headline": n["headline"], "account": acct,
                     "net_shares": int(shares), "avg_cost": round(avg_px, 2),
                     "px_after": round(after_px, 2),
                     "paper_pnl": round(shares * (after_px - avg_px))})

result = pd.DataFrame(rows).sort_values("paper_pnl", ascending=False)
print(result.head().to_string(index=False))   # top of the list gets reviewed first

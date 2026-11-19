# 05_spoofing.py: spoofing and layering.
# Pattern: big orders on one side, a small fill on the other side,
# then the big orders are cancelled within seconds.
import sqlite3
import pandas as pd

con = sqlite3.connect("surv.db")
o = pd.read_sql("SELECT * FROM orders", con, parse_dates=["ts", "end_ts"])
o["life_s"] = (o["end_ts"] - o["ts"]).dt.total_seconds()

BIG, FAST, WINDOW = 2000, 10, pd.Timedelta("30s")   # tune these

# 1. Big orders cancelled fast: the "bait".
bait = o[(o["status"] == "CANCELLED") & (o["qty"] >= BIG) & (o["life_s"] <= FAST)]

# 2. For each fill, look for bait on the opposite side from the same account.
fills = o[o["status"] == "FILLED"]
hits = []
for _, f in fills.iterrows():
    opp = "SELL" if f["side"] == "BUY" else "BUY"
    near = bait[(bait["account_id"] == f["account_id"]) & (bait["symbol"] == f["symbol"])
                & (bait["side"] == opp) & ((bait["ts"] - f["ts"]).abs() <= WINDOW)]
    if len(near):
        hits.append({"account": f["account_id"], "symbol": f["symbol"], "fill_ts": f["ts"],
                     "fill_side": f["side"], "fill_qty": f["qty"],
                     "bait_orders": len(near), "bait_qty": near["qty"].sum(),
                     "ratio": round(near["qty"].sum() / f["qty"], 1)})

result = pd.DataFrame(hits)
print(result.to_string(index=False))

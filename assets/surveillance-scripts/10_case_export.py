# 10_case_export.py: run every check and write one alert file for review.
import runpy, sqlite3
from datetime import date
import pandas as pd

con = sqlite3.connect("surv.db")
alerts = []

def run_sql(path):
    q = "\n".join(l for l in open(path) if not l.startswith("."))  # drop sqlite3 dot-commands
    return pd.read_sql(q, con)

def run_py(path):
    return runpy.run_path(path)["result"]          # each script leaves its table in `result`

for _, r in run_sql("04_wash_trades.sql").iterrows():
    alerts.append(("WASH", r.owner_id, f"{r.n_trades} same-owner trades, {r.shares} sh {r.symbol}"))
for _, r in run_py("05_spoofing.py").iterrows():
    alerts.append(("SPOOF", r.account, f"{r.bait_qty} sh bait vs {r.fill_qty} sh fill, {r.symbol}"))
for _, r in run_sql("06_marking_close.sql").iterrows():
    alerts.append(("MARKING_CLOSE", r.buy_acct, f"{r.share_of_vol:.0%} of last-10-min volume, {r.move_pct}% move"))
for _, r in run_sql("07_front_running.sql").iterrows():
    alerts.append(("FRONT_RUN", r.prop_acct, f"bought {r.secs_after}s into client order {r.client_order}"))
for _, r in run_py("08_insider.py").head(1).iterrows():
    alerts.append(("INSIDER", r.account, f"{r.net_shares} sh before news, paper P&L ${r.paper_pnl:,}"))

df = pd.DataFrame(alerts, columns=["rule", "account", "detail"])
df.insert(0, "alert_id", [f"{date.today():%Y%m%d}-{i:03d}" for i in range(1, len(df) + 1)])
df["status"] = "OPEN"
df["analyst_note"] = ""      # the analyst writes the disposition here
df.to_csv("alerts.csv", index=False)
print("\n", df.to_string(index=False))

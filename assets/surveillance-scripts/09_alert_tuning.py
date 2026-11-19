# 09_alert_tuning.py: tune a threshold.
# Sweep the cancel-rate threshold and count alerts vs. true hits.
# Labels come from past case outcomes (here: known bad accounts).
import sqlite3
import pandas as pd

con = sqlite3.connect("surv.db")
o = pd.read_sql("SELECT account_id, status, qty FROM orders", con)
o["cxl_qty"] = o["qty"].where(o["status"] == "CANCELLED", 0)
rate = o.groupby("account_id")[["cxl_qty", "qty"]].sum()
rate["cancel_rate"] = rate["cxl_qty"] / rate["qty"]

confirmed = {"A5"}          # accounts a past investigation confirmed

rows = []
for th in [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
    alerted = set(rate.index[rate["cancel_rate"] >= th])
    tp = len(alerted & confirmed)
    rows.append({"threshold": th, "alerts": len(alerted), "true_hits": tp,
                 "false_pos": len(alerted) - tp,
                 "precision": round(tp / len(alerted), 2) if alerted else None,
                 "recall": tp / len(confirmed)})
print(pd.DataFrame(rows).to_string(index=False))
# Pick the highest threshold that keeps recall at 1.0. Write down why.

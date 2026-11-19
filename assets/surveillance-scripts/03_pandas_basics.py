# 03_pandas_basics.py: load SQL into pandas and reshape it.
# Run: python3 03_pandas_basics.py   (needs: pip install pandas)
import sqlite3
import pandas as pd

con = sqlite3.connect("surv.db")
trades = pd.read_sql("SELECT * FROM trades", con, parse_dates=["ts"])

# 1. Quick health check: shape, types, nulls.
print(trades.shape)
print(trades.dtypes)
print(trades.isna().sum().sum(), "nulls")

# 2. VWAP per symbol: sum(price * qty) / sum(qty).
trades["notional"] = trades["price"] * trades["qty"]
vwap = trades.groupby("symbol")[["notional", "qty"]].sum()
vwap["vwap"] = (vwap["notional"] / vwap["qty"]).round(2)
print(vwap)

# 3. Five-minute bars for XYZ: open, high, low, close, volume.
xyz = trades[trades["symbol"] == "XYZ"].set_index("ts").sort_index()
bars = xyz["price"].resample("5min").ohlc()
bars["volume"] = xyz["qty"].resample("5min").sum()
print(bars.dropna().tail())

# 4. Each account's share of the day's volume.
vol = pd.concat([trades[["buy_acct", "qty"]].set_axis(["acct", "qty"], axis=1),
                 trades[["sell_acct", "qty"]].set_axis(["acct", "qty"], axis=1)])
share = vol.groupby("acct")["qty"].sum() / (2 * trades["qty"].sum())
print(share.sort_values(ascending=False).round(3).head())

# 00_build_db.py: build a small practice database of one trading day.
# Run once: python3 00_build_db.py  ->  creates surv.db
import sqlite3, random
from datetime import datetime, timedelta

random.seed(7)
day = datetime(2026, 3, 2, 9, 30)
t = lambda m, s=0: (day + timedelta(minutes=m, seconds=s)).isoformat(sep=" ")

con = sqlite3.connect("surv.db")
con.executescript("""
DROP TABLE IF EXISTS accounts; DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS trades;   DROP TABLE IF EXISTS news;
CREATE TABLE accounts(account_id TEXT PRIMARY KEY, owner_id TEXT, acct_type TEXT);
CREATE TABLE orders(order_id INTEGER PRIMARY KEY, ts TEXT, account_id TEXT, symbol TEXT,
                    side TEXT, price REAL, qty INT, status TEXT, end_ts TEXT);
CREATE TABLE trades(trade_id INTEGER PRIMARY KEY, ts TEXT, symbol TEXT,
                    buy_acct TEXT, sell_acct TEXT, price REAL, qty INT);
CREATE TABLE news(symbol TEXT, ts TEXT, headline TEXT);
""")

# 8 client accounts and 1 prop account. A3 and A4 share one owner.
accts = [(f"A{i}", f"O{i}", "client") for i in range(1, 9)] + [("P1", "FIRM", "prop")]
accts[3] = ("A4", "O3", "client")
con.executemany("INSERT INTO accounts VALUES (?,?,?)", accts)
clients = [a[0] for a in accts if a[2] == "client"]

orders, trades = [], []
def trade(ts, sym, b, s, px, q):
    trades.append((ts, sym, b, s, round(px, 2), q))
def order(ts, acct, sym, side, px, q, status, end):
    orders.append((ts, acct, sym, side, round(px, 2), q, status, end))

# Normal market: 400 random trades and orders, 25% of orders cancelled.
px = {"XYZ": 50.0, "ABC": 20.0}
for m in sorted(random.randrange(385) for _ in range(400)):
    sym = random.choice(["XYZ", "ABC"])
    if sym == "ABC" and m >= 270:   # ABC news lands at 14:00 (minute 270)
        continue
    px[sym] *= 1 + random.gauss(0, 0.0005)
    b, s = random.sample(clients, 2)
    if {b, s} == {"A3", "A4"}:      # keep the planted wash pair clean
        continue
    q = random.choice([100, 200, 300, 500])
    trade(t(m, random.randint(0, 59)), sym, b, s, px[sym], q)
    acct = random.choice(clients)
    cancel = random.random() < 0.25
    order(t(m), acct, sym, random.choice(["BUY", "SELL"]), px[sym], q,
          "CANCELLED" if cancel else "FILLED", t(m, random.randint(5, 120)))

# Planted case 1, wash trades: A3 buys from A4 (same owner) at one price.
for k in range(5):
    trade(t(60 + k * 7), "XYZ", "A3", "A4", 50.10, 1000)

# Planted case 2, spoofing: A5 stacks big sells, buys small, cancels the sells.
for k in range(5):
    order(t(45, k), "A5", "XYZ", "SELL", 50.05 + k * 0.01, 5000, "CANCELLED", t(45, 8))
order(t(45, 5), "A5", "XYZ", "BUY", 49.90, 200, "FILLED", t(45, 6))
trade(t(45, 6), "XYZ", "A5", "A2", 49.90, 200)

# Planted case 3, marking the close: A6 buys hard in the last 5 minutes.
for k in range(10):
    trade(t(385, k * 25), "XYZ", "A6", random.choice(clients[:5]), px["XYZ"] + k * 0.15, 800)

# Planted case 4, front running: client A1 sends a big buy, prop P1 buys first.
order(t(90), "A1", "XYZ", "BUY", 50.30, 50000, "FILLED", t(95))
order(t(90, 20), "P1", "XYZ", "BUY", 50.25, 3000, "FILLED", t(90, 25))

# Planted case 5, insider trading: A7 buys ABC 30 minutes before deal news.
con.execute("INSERT INTO news VALUES ('ABC', ?, 'ABC to be acquired at $26')", (t(270),))
for k in range(4):
    trade(t(240 + k * 5), "ABC", "A7", "A8", 20.1 + k * 0.02, 5000)
for k in range(6):
    trade(t(272 + k * 10), "ABC", random.choice(clients[:3]), "A8", 25.6 + k * 0.05, 300)

con.executemany("INSERT INTO trades(ts,symbol,buy_acct,sell_acct,price,qty) VALUES (?,?,?,?,?,?)", trades)
con.executemany("INSERT INTO orders(ts,account_id,symbol,side,price,qty,status,end_ts) VALUES (?,?,?,?,?,?,?,?)", orders)
con.commit()
print({tb: con.execute(f"SELECT COUNT(*) FROM {tb}").fetchone()[0] for tb in ["accounts", "orders", "trades", "news"]})

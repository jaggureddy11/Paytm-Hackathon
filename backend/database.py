import sqlite3
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path

# On Vercel or AWS Lambda serverless environments, the filesystem is read-only except /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    DB_DIR = Path("/tmp")
    DB_PATH = DB_DIR / "saathi.db"
    bundled_db = Path(__file__).parent / "data" / "saathi.db"
    if bundled_db.exists() and not DB_PATH.exists():
        try:
            shutil.copyfile(bundled_db, DB_PATH)
        except Exception:
            pass
else:
    DB_DIR = Path(__file__).parent / "data"
    DB_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH = DB_DIR / "saathi.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Merchant Profile table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS merchant_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL,
        category TEXT NOT NULL,
        preferred_language TEXT NOT NULL DEFAULT 'te-IN',
        closing_time TEXT NOT NULL DEFAULT '21:30',
        created_at TEXT NOT NULL
    )
    """)

    # Products table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        opening_stock INTEGER NOT NULL DEFAULT 0,
        purchased_stock INTEGER NOT NULL DEFAULT 0,
        sold_stock INTEGER NOT NULL DEFAULT 0,
        remaining_stock INTEGER NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0.0,
        min_threshold INTEGER NOT NULL DEFAULT 5,
        unit TEXT NOT NULL DEFAULT 'packet',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)

    # Transactions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL DEFAULT '10:00:00',
        type TEXT NOT NULL, -- 'qr_collection', 'cash_collection', 'expense', 'stock_purchase', 'product_sale'
        category TEXT NOT NULL, -- 'sales', 'utilities', 'rent', 'inventory', 'other'
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'QR', -- 'QR', 'Cash', 'Bank Transfer', 'Other'
        source TEXT NOT NULL DEFAULT 'Demo', -- 'Voice', 'Manual', 'Demo'
        confirmed INTEGER NOT NULL DEFAULT 1,
        product_id INTEGER,
        quantity INTEGER DEFAULT 0,
        cost_of_goods REAL NOT NULL DEFAULT 0.0,
        is_demo INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id)
    )
    """)

    # Ensure all required columns exist in existing transactions table
    cursor.execute("PRAGMA table_info(transactions)")
    cols = [c[1] for c in cursor.fetchall()]
    if "time" not in cols:
        cursor.execute("ALTER TABLE transactions ADD COLUMN time TEXT NOT NULL DEFAULT '10:00:00'")
    if "payment_method" not in cols:
        cursor.execute("ALTER TABLE transactions ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'QR'")
    if "source" not in cols:
        cursor.execute("ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'Demo'")
    if "confirmed" not in cols:
        cursor.execute("ALTER TABLE transactions ADD COLUMN confirmed INTEGER NOT NULL DEFAULT 1")
    if "cost_of_goods" not in cols:
        cursor.execute("ALTER TABLE transactions ADD COLUMN cost_of_goods REAL NOT NULL DEFAULT 0.0")

    # Daily Closing Summaries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_closing_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        closing_date TEXT NOT NULL UNIQUE,
        qr_collections REAL NOT NULL DEFAULT 0.0,
        cash_collections REAL NOT NULL DEFAULT 0.0,
        total_collections REAL NOT NULL DEFAULT 0.0,
        total_expenses REAL NOT NULL DEFAULT 0.0,
        total_stock_purchases REAL NOT NULL DEFAULT 0.0,
        estimated_balance REAL NOT NULL DEFAULT 0.0,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    # Check if merchant profile already seeded
    cursor.execute("SELECT COUNT(*) FROM merchant_profile")
    if cursor.fetchone()[0] == 0:
        seed_data(cursor)

    conn.commit()
    conn.close()

def seed_data(cursor):
    today = datetime.now().strftime("%Y-%m-%d")
    now_iso = datetime.now().isoformat()

    # Default Merchant Profile
    cursor.execute("""
    INSERT INTO merchant_profile (shop_name, category, preferred_language, closing_time, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, ("Sri Krishna Kirana & General Store", "Kirana / Grocery", "en-IN", "21:30", now_iso))

    # Initial Products
    # Milk starts with baseline to be updated or initialized
    products = [
        ("Milk Packets", "Dairy", 0, 0, 0, 0, 30.0, 10, "packets"),
        ("Fresh Bread", "Bakery", 0, 10, 4, 6, 40.0, 5, "packets"),
        ("Red Label Tea 250g", "Beverages", 5, 10, 3, 12, 140.0, 5, "boxes"),
        ("Cooking Oil 1L", "Groceries", 8, 12, 16, 4, 135.0, 6, "pouches"), # Low stock alert
        ("Basmati Rice 5kg", "Grains", 10, 15, 8, 17, 450.0, 5, "bags"),
    ]

    for p in products:
        cursor.execute("""
        INSERT INTO products (name, category, opening_stock, purchased_stock, sold_stock, remaining_stock, price, min_threshold, unit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], now_iso, now_iso))

    # Past 6 days transactions for trend charts
    for i in range(6, 0, -1):
        past_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        if i == 1:
            # YESTERDAY (exact figures from hackathon prompt for comparison test)
            qr_amt = 800.0
            cash_amt = 2000.0
            exp_amt = 300.0
        else:
            qr_amt = 900.0 + (i * 120) % 500
            cash_amt = 2000.0 + (i * 230) % 700
            exp_amt = 300.0 + (i * 80) % 300
        
        cursor.execute("""
        INSERT INTO transactions (date, time, type, category, amount, description, payment_method, source, confirmed, is_demo, created_at)
        VALUES (?, '11:30:00', 'qr_collection', 'sales', ?, 'Paytm Soundbox QR Collection', 'QR', 'Demo', 1, 1, ?)
        """, (past_date, qr_amt, now_iso))

        cursor.execute("""
        INSERT INTO transactions (date, time, type, category, amount, description, payment_method, source, confirmed, is_demo, created_at)
        VALUES (?, '17:45:00', 'cash_collection', 'sales', ?, 'Daily Cash Register Sales', 'Cash', 'Demo', 1, 1, ?)
        """, (past_date, cash_amt, now_iso))

        cursor.execute("""
        INSERT INTO transactions (date, time, type, category, amount, description, payment_method, source, confirmed, is_demo, created_at)
        VALUES (?, '19:15:00', 'expense', 'utilities', ?, 'Daily Miscellaneous Expense', 'Cash', 'Demo', 1, 1, ?)
        """, (past_date, exp_amt, now_iso))

    # TODAY's transactions as specified in Prompt:
    # Step 2: Show demo QR collections of ₹1,000
    cursor.execute("""
    INSERT INTO transactions (date, time, type, category, amount, description, payment_method, source, confirmed, is_demo, created_at)
    VALUES (?, '09:45:00', 'qr_collection', 'sales', ?, 'Paytm Soundbox QR Collections (Simulated Demo)', 'QR', 'Demo', 1, 1, ?)
    """, (today, 1000.0, now_iso))

def recalculate_product_stock(cursor, product_id):
    cursor.execute("""
    SELECT opening_stock, purchased_stock, sold_stock FROM products WHERE id = ?
    """, (product_id,))
    row = cursor.fetchone()
    if row:
        remaining = row["opening_stock"] + row["purchased_stock"] - row["sold_stock"]
        cursor.execute("""
        UPDATE products SET remaining_stock = ?, updated_at = ? WHERE id = ?
        """, (remaining, datetime.now().isoformat(), product_id))

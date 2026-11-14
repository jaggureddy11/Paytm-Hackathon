import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from database import init_db, get_connection, recalculate_product_stock, seed_data
from models import (
    MerchantProfile, Product, ProductCreate, ProductAdjust,
    Transaction, TransactionCreate, TransactionUpdate, ClosingSummaryConfirm,
    TTSRequest, ChatRequest
)
from services.sarvam_service import transcribe_audio, synthesize_speech, get_sarvam_client
from services.intent_engine import (
    handle_closing_flow, answer_business_question, get_today_stats, save_confirmed_closing,
    parse_single_transaction_intent, save_single_transaction, is_affirmative
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paytm_saathi")

app = FastAPI(
    title="Paytm Saathi Backend API",
    description="Multilingual Voice-First AI Business Assistant for Small Merchants",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on import and startup
init_db()

@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("Database initialized successfully.")

@app.get("/api/health")
def health_check():
    client = get_sarvam_client()
    return {
        "status": "healthy",
        "sarvam_configured": client is not None,
        "timestamp": datetime.now().isoformat()
    }

# ==================== MERCHANT PROFILE ====================

@app.get("/api/merchant")
def get_merchant():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM merchant_profile ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "shop_name": "Sri Krishna Kirana & General Store",
        "category": "Kirana / Grocery",
        "preferred_language": "en-IN",
        "closing_time": "21:30"
    }

@app.post("/api/merchant")
def update_merchant(profile: MerchantProfile):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO merchant_profile (shop_name, category, preferred_language, closing_time, created_at)
    VALUES (?, ?, ?, ?, ?)
    """, (profile.shop_name, profile.category, profile.preferred_language, profile.closing_time, now_iso))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"success": True, "id": new_id, "message": "Merchant profile updated"}

# ==================== DASHBOARD API ====================

@app.get("/api/dashboard")
def get_dashboard_data():
    conn = get_connection()
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")

    # Financial Information: Today's figures from transactions
    cursor.execute("""
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'qr_collection' THEN amount ELSE 0 END), 0) as qr_collections,
        COALESCE(SUM(CASE WHEN type = 'cash_collection' THEN amount ELSE 0 END), 0) as cash_collections,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
        COALESCE(SUM(CASE WHEN type = 'stock_purchase' THEN amount ELSE 0 END), 0) as stock_purchases
    FROM transactions 
    WHERE date = ?
    """, (today,))
    fin_row = cursor.fetchone()

    qr_coll = float(fin_row["qr_collections"])
    cash_coll = float(fin_row["cash_collections"])
    total_coll = qr_coll + cash_coll
    expenses = float(fin_row["expenses"])
    stock_purch = float(fin_row["stock_purchases"])
    
    # Balance: Collections minus recorded outflows (transparent calculation)
    estimated_balance = total_coll - expenses - stock_purch

    # Inventory summary
    cursor.execute("SELECT COUNT(*) as total_products FROM products")
    total_products = cursor.fetchone()["total_products"]

    cursor.execute("""
    SELECT COUNT(*) as low_stock_count FROM products WHERE remaining_stock <= min_threshold
    """)
    low_stock_count = cursor.fetchone()["low_stock_count"]

    cursor.execute("""
    SELECT id, name, category, remaining_stock, min_threshold, unit, price
    FROM products 
    WHERE remaining_stock <= min_threshold
    ORDER BY remaining_stock ASC LIMIT 5
    """)
    low_stock_items = [dict(r) for r in cursor.fetchall()]

    # Weekly sales & trends (last 7 days)
    weekly_chart = []
    days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        d = datetime.now() - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'qr_collection' THEN amount ELSE 0 END), 0) as qr,
            COALESCE(SUM(CASE WHEN type = 'cash_collection' THEN amount ELSE 0 END), 0) as cash,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM transactions 
        WHERE date = ?
        """, (d_str,))
        row = cursor.fetchone()
        qr_val = float(row["qr"])
        cash_val = float(row["cash"])
        exp_val = float(row["expense"])
        weekly_chart.append({
            "date": d_str,
            "day": days_map[d.weekday()],
            "qr": qr_val,
            "cash": cash_val,
            "total": qr_val + cash_val,
            "expense": exp_val
        })

    # AI Business Insights dynamically calculated from actual DB
    insights = []
    
    # 1. Collection breakdown
    if total_coll > 0:
        qr_pct = int((qr_coll / total_coll) * 100) if total_coll else 0
        if qr_coll > cash_coll:
            insights.append({
                "type": "positive",
                "title": "Digital Payments Leading",
                "message": f"Your Paytm QR collections ({qr_pct}%) are higher than cash collections today.",
                "action": "Maintain clear Paytm Soundbox audio notifications."
            })
        else:
            insights.append({
                "type": "neutral",
                "title": "Healthy Cash Liquidity",
                "message": f"Cash collections account for {100 - qr_pct}% of today's total intake.",
                "action": "Ensure cash register tally matches at day-end closing."
            })

    # 2. Inventory alerts
    if low_stock_count > 0:
        item_names = ", ".join([item["name"] for item in low_stock_items[:2]])
        insights.append({
            "type": "warning",
            "title": f"Low Stock Alert ({low_stock_count} Items)",
            "message": f"{item_names} are near or below minimum stock threshold.",
            "action": "Ask Voice Saathi to record a stock re-order."
        })
    else:
        insights.append({
            "type": "positive",
            "title": "Optimal Inventory Levels",
            "message": "All essential grocery and dairy items are above minimum safety thresholds.",
            "action": "Stock levels look balanced for weekend demand."
        })

    # 3. Expense vs Collection Ratio
    if expenses > 0:
        exp_pct = int((expenses / total_coll) * 100) if total_coll > 0 else 0
        insights.append({
            "type": "info",
            "title": "Operating Outflows Tracked",
            "message": f"Today's expenses are ₹{expenses:,.0f} ({exp_pct}% of total collections).",
            "action": "All utility bills and payments recorded with transparency."
        })

    conn.close()

    return {
        "today_date": today,
        "financials": {
            "qr_collections": qr_coll,
            "cash_collections": cash_coll,
            "total_collections": total_coll,
            "expenses": expenses,
            "stock_purchases": stock_purch,
            "estimated_balance": estimated_balance,
            "has_closed_today": cash_coll > 0 or expenses > 0
        },
        "inventory": {
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "low_stock_items": low_stock_items
        },
        "weekly_chart": weekly_chart,
        "insights": insights
    }

# ==================== INVENTORY API ====================

@app.get("/api/inventory")
def get_products():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, name, category, opening_stock, purchased_stock, sold_stock, 
           remaining_stock, price, min_threshold, unit, created_at, updated_at
    FROM products
    ORDER BY name ASC
    """)
    products = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return products

@app.post("/api/inventory")
def create_product(product: ProductCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    remaining = product.opening_stock + product.purchased_stock - product.sold_stock
    try:
        cursor.execute("""
        INSERT INTO products (name, category, opening_stock, purchased_stock, sold_stock, remaining_stock, price, min_threshold, unit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (product.name, product.category, product.opening_stock, product.purchased_stock, product.sold_stock, remaining, product.price, product.min_threshold, product.unit, now_iso, now_iso))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return {"success": True, "id": new_id, "message": "Product created successfully"}
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Failed to create product: {str(e)}")

@app.put("/api/inventory/{product_id}")
def update_product(product_id: int, product: ProductCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    remaining = product.opening_stock + product.purchased_stock - product.sold_stock
    cursor.execute("""
    UPDATE products 
    SET name = ?, category = ?, opening_stock = ?, purchased_stock = ?, sold_stock = ?, remaining_stock = ?, price = ?, min_threshold = ?, unit = ?, updated_at = ?
    WHERE id = ?
    """, (product.name, product.category, product.opening_stock, product.purchased_stock, product.sold_stock, remaining, product.price, product.min_threshold, product.unit, now_iso, product_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Product updated"}

@app.post("/api/inventory/adjust")
def adjust_stock(adj: ProductAdjust):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    today = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("SELECT * FROM products WHERE id = ?", (adj.product_id,))
    p = cursor.fetchone()
    if not p:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    new_purch = p["purchased_stock"]
    new_sold = p["sold_stock"]

    if adj.adjustment_type == "purchase":
        new_purch += adj.quantity
        if adj.amount and adj.amount > 0:
            cursor.execute("""
            INSERT INTO transactions (date, type, category, amount, description, product_id, quantity, is_demo, created_at)
            VALUES (?, 'stock_purchase', 'inventory', ?, ?, ?, ?, 1, ?)
            """, (today, adj.amount, f"Purchased {adj.quantity} {p['unit']} of {p['name']}", adj.product_id, adj.quantity, now_iso))
    elif adj.adjustment_type == "sale":
        new_sold += adj.quantity
        if adj.amount and adj.amount > 0:
            cursor.execute("""
            INSERT INTO transactions (date, type, category, amount, description, product_id, quantity, is_demo, created_at)
            VALUES (?, 'cash_collection', 'sales', ?, ?, ?, ?, 1, ?)
            """, (today, adj.amount, f"Sold {adj.quantity} {p['unit']} of {p['name']}", adj.product_id, adj.quantity, now_iso))
    elif adj.adjustment_type == "manual_set":
        # Adjust remaining by modifying opening or current
        remaining = adj.quantity
        cursor.execute("UPDATE products SET remaining_stock = ?, updated_at = ? WHERE id = ?", (remaining, now_iso, adj.product_id))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Stock adjusted"}

    remaining = p["opening_stock"] + new_purch - new_sold
    cursor.execute("""
    UPDATE products SET purchased_stock = ?, sold_stock = ?, remaining_stock = ?, updated_at = ? WHERE id = ?
    """, (new_purch, new_sold, remaining, now_iso, adj.product_id))

    conn.commit()
    conn.close()
    return {"success": True, "message": "Stock adjusted successfully", "remaining": remaining}

# ==================== DAY-WISE BUSINESS RECORDS & REPORTS API ====================

@app.get("/api/records/days")
def get_records_days(filter: Optional[str] = "all", custom_date: Optional[str] = None):
    """
    Returns chronological day-wise summaries (newest first).
    Each day card includes:
    - Date and day of the week (e.g. '14 November 2026 — Today')
    - QR Sales, Cash Sales, Total Sales, Expenses
    - Estimated operating result (before COGS)
    - Comparison against immediately preceding calendar day
    """
    conn = get_connection()
    cursor = conn.cursor()
    today_dt = datetime.now()
    today_str = today_dt.strftime("%Y-%m-%d")

    where_clause = ""
    params = []
    if filter == "today":
        where_clause = "WHERE date = ?"
        params.append(today_str)
    elif filter == "week":
        week_start = (today_dt - timedelta(days=7)).strftime("%Y-%m-%d")
        where_clause = "WHERE date >= ?"
        params.append(week_start)
    elif filter == "month":
        month_start = today_dt.strftime("%Y-%m-01")
        where_clause = "WHERE date >= ?"
        params.append(month_start)
    elif filter == "custom" and custom_date:
        where_clause = "WHERE date = ?"
        params.append(custom_date)

    cursor.execute(f"SELECT DISTINCT date FROM transactions {where_clause} ORDER BY date DESC", params)
    date_rows = cursor.fetchall()
    dates = [r["date"] for r in date_rows]

    results = []
    for d in dates:
        dt = datetime.strptime(d, "%Y-%m-%d")
        is_today = (d == today_str)
        is_yesterday = (d == (today_dt - timedelta(days=1)).strftime("%Y-%m-%d"))

        if is_today:
            label = f"{dt.strftime('%d %B %Y')} — Today"
        elif is_yesterday:
            label = f"{dt.strftime('%d %B %Y')} — Yesterday"
        else:
            label = f"{dt.strftime('%d %B %Y')} — {dt.strftime('%A')}"

        cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN type = 'qr_collection' OR (type = 'product_sale' AND payment_method = 'QR') THEN amount ELSE 0 END), 0) as qr_sales,
            COALESCE(SUM(CASE WHEN type = 'cash_collection' OR (type = 'product_sale' AND payment_method = 'Cash') THEN amount ELSE 0 END), 0) as cash_sales,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
            COALESCE(SUM(CASE WHEN type = 'stock_purchase' THEN amount ELSE 0 END), 0) as stock_purchases,
            COALESCE(SUM(cost_of_goods), 0) as cogs,
            COUNT(*) as tx_count
        FROM transactions WHERE date = ?
        """, (d,))
        row = cursor.fetchone()

        qr_sales = float(row["qr_sales"])
        cash_sales = float(row["cash_sales"])
        total_sales = qr_sales + cash_sales
        expenses = float(row["expenses"])
        stock_purchases = float(row["stock_purchases"])
        cogs = float(row["cogs"])
        operating_result = total_sales - expenses
        has_cogs = (cogs > 0)
        gross_profit = (total_sales - cogs) if has_cogs else None
        net_profit = (gross_profit - expenses) if has_cogs else None

        # Comparison with immediately preceding calendar day
        prev_date = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
        cursor.execute("""
        SELECT 
            COALESCE(SUM(CASE WHEN type IN ('qr_collection', 'cash_collection') OR type = 'product_sale' THEN amount ELSE 0 END), 0) as prev_sales,
            COUNT(*) as prev_count
        FROM transactions WHERE date = ?
        """, (prev_date,))
        prev_row = cursor.fetchone()

        has_prev = bool(prev_row and prev_row["prev_count"] > 0)
        if has_prev:
            prev_sales = float(prev_row["prev_sales"])
            diff_sales = total_sales - prev_sales
            pct_change = round(((total_sales - prev_sales) / prev_sales) * 100, 1) if prev_sales > 0 else 0.0
            trend = "up" if diff_sales > 0 else "down" if diff_sales < 0 else "same"
            if diff_sales > 0:
                comp_text = f"Sales increased by {abs(pct_change):.0f}% compared with yesterday."
            elif diff_sales < 0:
                comp_text = f"Sales decreased by {abs(pct_change):.0f}% compared with yesterday."
            else:
                comp_text = "Sales unchanged compared with yesterday."
        else:
            prev_sales = None
            diff_sales = None
            pct_change = None
            trend = "none"
            comp_text = "No records available for comparison."

        results.append({
            "date": d,
            "formatted_date": dt.strftime("%d %B %Y"),
            "day_name": dt.strftime("%A"),
            "is_today": is_today,
            "is_yesterday": is_yesterday,
            "label": label,
            "qr_sales": qr_sales,
            "cash_sales": cash_sales,
            "total_sales": total_sales,
            "expenses": expenses,
            "stock_purchases": stock_purchases,
            "operating_result": operating_result,
            "operating_result_label": f"Estimated operating result: ₹{operating_result:,.0f} before cost of goods sold",
            "has_cogs": has_cogs,
            "gross_profit": gross_profit,
            "net_profit": net_profit,
            "profit_label": "Profit/Loss unavailable — more cost information needed" if not has_cogs else None,
            "tx_count": int(row["tx_count"]),
            "comparison": {
                "has_prev": has_prev,
                "prev_date": prev_date,
                "prev_sales": prev_sales,
                "diff_sales": diff_sales,
                "pct_change": pct_change,
                "trend": trend,
                "text": comp_text
            }
        })

    conn.close()
    return results

@app.get("/api/records/day/{date_str}")
def get_daily_business_report(date_str: str):
    """
    Returns complete Daily Business Report for the selected date:
    - Summary cards: Total Sales, QR Sales, Cash Sales, Expenses, Stock Purchases, Profit/Loss
    - Compared with Yesterday
    - Sales Breakdown (QR & Cash totals + transaction counts)
    - Expenses List (description, amount, time)
    - Stock Purchases List (product, qty, amount, time)
    - All Transactions in chronological order
    """
    conn = get_connection()
    cursor = conn.cursor()
    today_dt = datetime.now()
    today_str = today_dt.strftime("%Y-%m-%d")

    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    is_today = (date_str == today_str)
    is_yesterday = (date_str == (today_dt - timedelta(days=1)).strftime("%Y-%m-%d"))

    cursor.execute("""
    SELECT t.*, p.name as product_name
    FROM transactions t
    LEFT JOIN products p ON t.product_id = p.id
    WHERE t.date = ?
    ORDER BY t.time ASC, t.id ASC
    """, (date_str,))
    tx_rows = cursor.fetchall()

    all_txs = []
    qr_sales = 0.0
    qr_count = 0
    cash_sales = 0.0
    cash_count = 0
    expenses = 0.0
    stock_purchases = 0.0
    cogs = 0.0
    expenses_list = []
    stock_list = []

    for r in tx_rows:
        t_id = r["id"]
        t_time = r["time"] or "10:00:00"
        t_type = r["type"]
        t_cat = r["category"]
        t_amt = float(r["amount"])
        t_desc = r["description"]
        t_pay = r["payment_method"] or "Cash"
        t_src = r["source"] or "Manual"
        t_cog = float(r["cost_of_goods"] or 0.0)
        cogs += t_cog

        is_credit = t_type in ("qr_collection", "cash_collection", "product_sale")
        if t_type == "qr_collection" or (t_type == "product_sale" and t_pay == "QR"):
            qr_sales += t_amt
            qr_count += 1
        elif t_type == "cash_collection" or (t_type == "product_sale" and t_pay == "Cash"):
            cash_sales += t_amt
            cash_count += 1
        elif t_type == "expense":
            expenses += t_amt
            expenses_list.append({
                "id": t_id,
                "description": t_desc,
                "amount": t_amt,
                "time": t_time,
                "category": t_cat
            })
        elif t_type == "stock_purchase":
            stock_purchases += t_amt
            stock_list.append({
                "id": t_id,
                "product_name": r["product_name"] or t_desc,
                "quantity": int(r["quantity"] or 0),
                "amount": t_amt,
                "time": t_time
            })

        all_txs.append({
            "id": t_id,
            "date": r["date"],
            "time": t_time,
            "type": t_type,
            "category": t_cat,
            "amount": t_amt,
            "description": t_desc,
            "payment_method": t_pay,
            "source": t_src,
            "is_credit": is_credit,
            "quantity": r["quantity"],
            "product_name": r["product_name"]
        })

    total_sales = qr_sales + cash_sales
    has_cogs = (cogs > 0)
    gross_profit = (total_sales - cogs) if has_cogs else None
    net_profit = (gross_profit - expenses) if has_cogs else None
    sales_after_expenses = total_sales - expenses

    # Comparison with immediately preceding calendar day
    prev_date = (dt - timedelta(days=1)).strftime("%Y-%m-%d")
    cursor.execute("""
    SELECT 
        COALESCE(SUM(CASE WHEN type IN ('qr_collection', 'cash_collection') OR type = 'product_sale' THEN amount ELSE 0 END), 0) as prev_sales,
        COALESCE(SUM(CASE WHEN type = 'qr_collection' OR (type = 'product_sale' AND payment_method = 'QR') THEN amount ELSE 0 END), 0) as prev_qr,
        COALESCE(SUM(CASE WHEN type = 'cash_collection' OR (type = 'product_sale' AND payment_method = 'Cash') THEN amount ELSE 0 END), 0) as prev_cash,
        COUNT(*) as prev_count
    FROM transactions WHERE date = ?
    """, (prev_date,))
    prev_row = cursor.fetchone()
    conn.close()

    has_yesterday = bool(prev_row and prev_row["prev_count"] > 0)
    if has_yesterday:
        y_sales = float(prev_row["prev_sales"])
        y_qr = float(prev_row["prev_qr"])
        y_cash = float(prev_row["prev_cash"])
        diff_amount = total_sales - y_sales
        pct_change = round(((total_sales - y_sales) / y_sales) * 100, 1) if y_sales > 0 else 0.0
        trend = "up" if diff_amount > 0 else "down" if diff_amount < 0 else "same"
        if diff_amount > 0:
            comp_message = f"Sales increased by {abs(pct_change):.0f}% compared with yesterday."
        elif diff_amount < 0:
            comp_message = f"Sales decreased by {abs(pct_change):.0f}% compared with yesterday."
        else:
            comp_message = "Sales unchanged compared with yesterday."
        yesterday_comp = {
            "has_yesterday": True,
            "yesterday_date": prev_date,
            "yesterday_total_sales": y_sales,
            "today_total_sales": total_sales,
            "diff_amount": diff_amount,
            "pct_change": pct_change,
            "trend": trend,
            "message": comp_message,
            "qr_diff": {
                "yesterday": y_qr,
                "today": qr_sales,
                "diff": qr_sales - y_qr
            },
            "cash_diff": {
                "yesterday": y_cash,
                "today": cash_sales,
                "diff": cash_sales - y_cash
            }
        }
    else:
        yesterday_comp = {
            "has_yesterday": False,
            "yesterday_date": prev_date,
            "yesterday_total_sales": None,
            "today_total_sales": total_sales,
            "diff_amount": None,
            "pct_change": None,
            "trend": "none",
            "message": "No records available for comparison.",
            "qr_diff": None,
            "cash_diff": None
        }

    return {
        "date": date_str,
        "formatted_date": dt.strftime("%d %B %Y"),
        "day_name": dt.strftime("%A"),
        "is_today": is_today,
        "is_yesterday": is_yesterday,
        "summary": {
            "total_sales": total_sales,
            "qr_sales": qr_sales,
            "cash_sales": cash_sales,
            "expenses": expenses,
            "stock_purchases": stock_purchases,
            "sales_after_expenses": sales_after_expenses,
            "has_cogs": has_cogs,
            "cogs": cogs,
            "gross_profit": gross_profit,
            "net_profit": net_profit,
            "profit_label": f"₹{net_profit:,.0f}" if has_cogs else "Profit/Loss unavailable — more cost information needed",
            "explanation": "Sales after recorded expenses — Note: this is not verified profit because product cost (COGS) is not yet factored"
        },
        "yesterday_comparison": yesterday_comp,
        "sales_breakdown": {
            "total_sales": total_sales,
            "total_sales_count": qr_count + cash_count,
            "qr_total": qr_sales,
            "qr_count": qr_count,
            "cash_total": cash_sales,
            "cash_count": cash_count
        },
        "expenses_list": expenses_list,
        "stock_purchases_list": stock_list,
        "transactions": all_txs
    }

@app.post("/api/records/transaction")
def create_day_transaction(tx: TransactionCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    tx_date = tx.date or datetime.now().strftime("%Y-%m-%d")
    tx_time = tx.time or datetime.now().strftime("%H:%M:%S")

    if tx.product_id and tx.quantity:
        cursor.execute("SELECT id, opening_stock, purchased_stock, sold_stock FROM products WHERE id = ?", (tx.product_id,))
        prow = cursor.fetchone()
        if prow:
            if tx.type == "stock_purchase":
                new_purch = prow["purchased_stock"] + tx.quantity
                rem = prow["opening_stock"] + new_purch - prow["sold_stock"]
                cursor.execute("UPDATE products SET purchased_stock = ?, remaining_stock = ?, updated_at = ? WHERE id = ?", (new_purch, rem, now_iso, tx.product_id))
            elif tx.type in ("product_sale", "qr_collection", "cash_collection"):
                new_sold = prow["sold_stock"] + tx.quantity
                rem = prow["opening_stock"] + prow["purchased_stock"] - new_sold
                cursor.execute("UPDATE products SET sold_stock = ?, remaining_stock = ?, updated_at = ? WHERE id = ?", (new_sold, rem, now_iso, tx.product_id))

    cursor.execute("""
    INSERT INTO transactions (date, time, type, category, amount, description, payment_method, source, confirmed, product_id, quantity, cost_of_goods, is_demo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, (tx_date, tx_time, tx.type, tx.category, tx.amount, tx.description, tx.payment_method or "Cash", tx.source or "Manual", tx.confirmed or 1, tx.product_id, tx.quantity, tx.cost_of_goods or 0.0, now_iso))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"success": True, "id": new_id, "message": "Transaction created successfully"}

@app.put("/api/records/transaction/{tx_id}")
def update_day_transaction(tx_id: int, tx: TransactionUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Transaction not found")

    date_val = tx.date or existing["date"]
    time_val = tx.time or existing["time"]
    type_val = tx.type or existing["type"]
    cat_val = tx.category or existing["category"]
    amt_val = tx.amount if tx.amount is not None else existing["amount"]
    desc_val = tx.description or existing["description"]
    pay_val = tx.payment_method or existing["payment_method"]

    cursor.execute("""
    UPDATE transactions 
    SET date = ?, time = ?, type = ?, category = ?, amount = ?, description = ?, payment_method = ?
    WHERE id = ?
    """, (date_val, time_val, type_val, cat_val, amt_val, desc_val, pay_val, tx_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Transaction updated successfully"}

@app.delete("/api/records/transaction/{tx_id}")
def delete_day_transaction(tx_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Transaction deleted successfully"}

# ==================== LEGACY BUSINESS RECORDS API (For backwards compatibility) ====================

@app.get("/api/records")
def get_records(date: Optional[str] = None, type: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT t.*, p.name as product_name FROM transactions t LEFT JOIN products p ON t.product_id = p.id WHERE 1=1"
    params = []

    if date:
        query += " AND t.date = ?"
        params.append(date)
    if type and type != "all":
        query += " AND t.type = ?"
        params.append(type)

    query += " ORDER BY t.id DESC LIMIT 100"
    cursor.execute(query, params)
    records = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return records

@app.post("/api/records")
def create_record(tx: TransactionCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now().isoformat()
    tx_date = tx.date or datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO transactions (date, type, category, amount, description, product_id, quantity, is_demo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    """, (tx_date, tx.type, tx.category, tx.amount, tx.description, tx.product_id, tx.quantity, now_iso))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"success": True, "id": new_id, "message": "Record saved"}

@app.put("/api/records/{tx_id}")
def update_record(tx_id: int, tx: TransactionCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE transactions 
    SET type = ?, category = ?, amount = ?, description = ?
    WHERE id = ?
    """, (tx.type, tx.category, tx.amount, tx.description, tx_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Record updated"}

@app.delete("/api/records/{tx_id}")
def delete_record(tx_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Record deleted"}

@app.get("/api/records/summary")
def get_records_summary(month: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    today = datetime.now().strftime("%Y-%m-%d")
    current_month = month or datetime.now().strftime("%Y-%m")

    # Today summary
    cursor.execute("""
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'qr_collection' THEN amount ELSE 0 END), 0) as qr,
        COALESCE(SUM(CASE WHEN type = 'cash_collection' THEN amount ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp,
        COALESCE(SUM(CASE WHEN type = 'stock_purchase' THEN amount ELSE 0 END), 0) as stock
    FROM transactions WHERE date = ?
    """, (today,))
    d_row = cursor.fetchone()

    # Month summary
    cursor.execute("""
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'qr_collection' THEN amount ELSE 0 END), 0) as qr,
        COALESCE(SUM(CASE WHEN type = 'cash_collection' THEN amount ELSE 0 END), 0) as cash,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp,
        COALESCE(SUM(CASE WHEN type = 'stock_purchase' THEN amount ELSE 0 END), 0) as stock
    FROM transactions WHERE strftime('%Y-%m', date) = ?
    """, (current_month,))
    m_row = cursor.fetchone()

    conn.close()
    return {
        "daily": {
            "qr": float(d_row["qr"]),
            "cash": float(d_row["cash"]),
            "total_collections": float(d_row["qr"]) + float(d_row["cash"]),
            "expenses": float(d_row["exp"]),
            "stock_purchases": float(d_row["stock"]),
            "balance": (float(d_row["qr"]) + float(d_row["cash"])) - float(d_row["exp"]) - float(d_row["stock"])
        },
        "monthly": {
            "month": current_month,
            "qr": float(m_row["qr"]),
            "cash": float(m_row["cash"]),
            "total_collections": float(m_row["qr"]) + float(m_row["cash"]),
            "expenses": float(m_row["exp"]),
            "stock_purchases": float(m_row["stock"]),
            "balance": (float(m_row["qr"]) + float(m_row["cash"])) - float(m_row["exp"]) - float(m_row["stock"])
        }
    }

# ==================== VOICE & AI CHAT API ====================

@app.post("/api/voice/stt")
async def speech_to_text_endpoint(
    audio: UploadFile = File(...),
    language_code: str = Form("en-IN")
):
    """Secure backend endpoint calling Sarvam Saaras v4 STT."""
    try:
        content = await audio.read()
        res = transcribe_audio(
            file_bytes=content,
            filename=audio.filename or "recording.webm",
            content_type=audio.content_type or "audio/webm",
            language_code=language_code
        )
        return res
    except Exception as e:
        logger.exception("STT endpoint error")
        return {"success": False, "error": str(e), "transcript": ""}

@app.post("/api/voice/tts")
def text_to_speech_endpoint(req: TTSRequest):
    """Secure backend endpoint calling Sarvam Bulbul v4 Flash TTS."""
    return synthesize_speech(
        text=req.text,
        language_code=req.language_code,
        speaker=req.speaker
    )

@app.post("/api/closing/trigger")
def trigger_closing_reminder(lang: Optional[str] = "en-IN"):
    """Trigger the simulated day-end closing reminder."""
    res = handle_closing_flow(step="START", user_text="", flow_data={}, lang=lang)
    tts_res = synthesize_speech(text=res["reply"], language_code=lang)
    return {
        **res,
        "audio_base64": tts_res.get("audio_base64")
    }

@app.post("/api/closing/confirm")
def confirm_closing_records(req: ClosingSummaryConfirm):
    """Atomically commit confirmed closing records to SQLite."""
    flow_data = {
        "qr_collections": req.qr_collections,
        "cash_collections": req.cash_collections,
        "expenses": req.expenses,
        "expense_description": req.expense_description or "Electricity bill",
        "stock_purchases": req.stock_purchases,
        "stock_item": req.stock_item or "Milk Packets",
        "stock_qty_purchased": req.stock_quantity_purchased or 20,
        "stock_qty_sold": req.stock_quantity_sold or 15
    }
    save_confirmed_closing(flow_data)
    return {"success": True, "message": "Closing records confirmed and saved in SQLite"}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    """
    Multilingual conversation endpoint:
    - Handles active closing flow step-by-step
    - Answers business questions using genuine SQLite records
    - Synthesizes spoken audio via Sarvam Bulbul v4 Flash
    """
    user_msg = req.message.strip()
    lang = req.language_code
    flow_state = req.flow_state or {}

    # 1. Check if user is confirming a pending single voice transaction
    if flow_state.get("is_single_confirm"):
        pending_entry = flow_state.get("pending_entry", {})
        if is_affirmative(user_msg):
            save_res = save_single_transaction(pending_entry, lang=lang)
            tts_res = synthesize_speech(text=save_res["reply"], language_code=lang)
            return {
                "reply": save_res["reply"],
                "audio_base64": tts_res.get("audio_base64"),
                "flow_state": {},
                "is_closing_flow": False,
                "saved": True,
                "single_transaction_saved": True,
                "updated_date": save_res.get("updated_date")
            }
        else:
            cancel_reply = "Transaction cancelled. Nothing was saved to records."
            if lang == "te-IN":
                cancel_reply = "లావాదేవీ రద్దు చేయబడింది. రికార్డులలో ఏదీ సేవ్ చేయబడలేదు."
            elif lang == "hi-IN":
                cancel_reply = "लेनदेन रद्द कर दिया गया। रिकॉर्ड में कुछ भी सहेजा नहीं गया।"
            tts_res = synthesize_speech(text=cancel_reply, language_code=lang)
            return {
                "reply": cancel_reply,
                "audio_base64": tts_res.get("audio_base64"),
                "flow_state": {},
                "is_closing_flow": False,
                "saved": False
            }

    # 2. Check if in closing flow
    if flow_state.get("is_closing_flow"):
        current_step = flow_state.get("next_step", "AWAITING_CASH")
        flow_data = flow_state.get("flow_data", {})
        result = handle_closing_flow(step=current_step, user_text=user_msg, flow_data=flow_data, lang=lang)
        
        # Synthesize audio with Bulbul
        tts_res = synthesize_speech(text=result["reply"], language_code=lang)
        return {
            "reply": result["reply"],
            "audio_base64": tts_res.get("audio_base64"),
            "flow_state": result,
            "is_closing_flow": result["is_closing_flow"],
            "summary_ready": result.get("summary_ready", False),
            "saved": result.get("saved", False)
        }

    # 3. Check if this message triggers closing flow
    lower_msg = user_msg.lower()
    if "closing" in lower_msg or "ముగింపు" in user_msg or "क्लोजिंग" in user_msg or "close day" in lower_msg or "daily closing" in lower_msg:
        result = handle_closing_flow(step="START", user_text=user_msg, flow_data={}, lang=lang)
        tts_res = synthesize_speech(text=result["reply"], language_code=lang)
        return {
            "reply": result["reply"],
            "audio_base64": tts_res.get("audio_base64"),
            "flow_state": result,
            "is_closing_flow": True,
            "summary_ready": False
        }

    # 4. Check for direct voice business transactions (e.g. "I collected ₹2,500 cash today", "I spent ₹500 on electricity")
    single_intent = parse_single_transaction_intent(user_msg, lang=lang)
    if single_intent:
        tts_res = synthesize_speech(text=single_intent["reply"], language_code=lang)
        return {
            "reply": single_intent["reply"],
            "audio_base64": tts_res.get("audio_base64"),
            "flow_state": single_intent,
            "is_single_confirm": True,
            "pending_entry": single_intent["pending_entry"],
            "is_closing_flow": False,
            "summary_ready": False
        }

    # 5. Check for direct business questions
    answer = answer_business_question(user_msg, lang=lang)
    if answer:
        tts_res = synthesize_speech(text=answer, language_code=lang)
        return {
            "reply": answer,
            "audio_base64": tts_res.get("audio_base64"),
            "flow_state": {},
            "is_closing_flow": False
        }

    # General fallback using Sarvam Chat (or polite fallback)
    client = get_sarvam_client()
    stats = get_today_stats()
    prompt_context = (
        f"You are Paytm Saathi, a friendly, concise AI business partner for an Indian merchant. "
        f"Today's stats: Total collections: ₹{stats['total_collections']:,.0f} (QR: ₹{stats['qr']:,.0f}, Cash: ₹{stats['cash']:,.0f}), "
        f"Expenses: ₹{stats['expenses']:,.0f}. "
        f"Reply directly in the requested language ({lang}). Keep the response under 2 sentences."
    )

    reply_text = None
    if client:
        try:
            chat_res = client.chat.completions(
                model="sarvam-105b-conversations",
                messages=[
                    {"role": "system", "content": prompt_context},
                    {"role": "user", "content": user_msg}
                ]
            )
            reply_text = chat_res.choices[0].message.content
        except Exception as e:
            logger.warning(f"Sarvam chat failed: {e}")

    if not reply_text:
        if lang == "te-IN":
            reply_text = f"పేటీఎం సాథీకి స్వాగతం. మీ వ్యాపార ప్రశ్నలు అడగండి (ఉదాహరణకు: 'ఈరోజు ఎంత కలెక్ట్ చేశాను?' లేదా 'పాల స్టాక్ ఎంత ఉంది?')."
        elif lang == "hi-IN":
            reply_text = f"पेटीएम साथी में आपका स्वागत है। आप अपने व्यवसाय से जुड़े प्रश्न पूछ सकते हैं (जैसे: 'आज कितना कलेक्शन हुआ?' या 'दूध का कितना स्टॉक है?')।"
        else:
            reply_text = f"Welcome to Paytm Saathi. Ask any business question (e.g., 'How much did I collect today?' or 'What is my milk stock?')."

    tts_res = synthesize_speech(text=reply_text, language_code=lang)
    return {
        "reply": reply_text,
        "audio_base64": tts_res.get("audio_base64"),
        "flow_state": {},
        "is_closing_flow": False
    }

# ==================== RESET DEMO API ====================

@app.post("/api/reset-demo")
def reset_demo():
    """Reset the database to initial demo state for testing the demo flow from scratch."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS transactions")
    cursor.execute("DROP TABLE IF EXISTS products")
    cursor.execute("DROP TABLE IF EXISTS merchant_profile")
    cursor.execute("DROP TABLE IF EXISTS daily_closing_summaries")
    conn.commit()
    conn.close()

    init_db()
    return {"success": True, "message": "Demo data reset to initial state"}

# Mount frontend static distribution if built
dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")


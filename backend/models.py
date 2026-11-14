from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class MerchantProfile(BaseModel):
    id: Optional[int] = None
    shop_name: str
    category: str
    preferred_language: str = "en-IN" # 'te-IN', 'hi-IN', 'en-IN'
    closing_time: str = "21:30"
    created_at: Optional[str] = None

class Product(BaseModel):
    id: Optional[int] = None
    name: str
    category: str
    opening_stock: int = 0
    purchased_stock: int = 0
    sold_stock: int = 0
    remaining_stock: int = 0
    price: float = 0.0
    min_threshold: int = 5
    unit: str = "packet"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    category: str
    opening_stock: int = 0
    purchased_stock: int = 0
    sold_stock: int = 0
    price: float = 0.0
    min_threshold: int = 5
    unit: str = "packet"

class ProductAdjust(BaseModel):
    product_id: int
    adjustment_type: str # 'purchase', 'sale', 'manual_set'
    quantity: int
    amount: Optional[float] = None
    notes: Optional[str] = None

class Transaction(BaseModel):
    id: Optional[int] = None
    date: str
    time: Optional[str] = "10:00:00"
    type: str # 'qr_collection', 'cash_collection', 'expense', 'stock_purchase', 'product_sale'
    category: str
    amount: float
    description: str
    payment_method: str = "QR" # 'QR', 'Cash', 'Bank Transfer', 'Other'
    source: str = "Manual" # 'Voice', 'Manual', 'Demo'
    confirmed: int = 1
    product_id: Optional[int] = None
    quantity: Optional[int] = 0
    cost_of_goods: float = 0.0
    is_demo: int = 1
    created_at: Optional[str] = None

class TransactionCreate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    type: str
    category: str
    amount: float
    description: str
    payment_method: Optional[str] = "QR"
    source: Optional[str] = "Manual"
    confirmed: Optional[int] = 1
    product_id: Optional[int] = None
    quantity: Optional[int] = 0
    cost_of_goods: Optional[float] = 0.0

class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    payment_method: Optional[str] = None
    source: Optional[str] = None
    confirmed: Optional[int] = None
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    cost_of_goods: Optional[float] = None

class ClosingSummaryConfirm(BaseModel):
    qr_collections: Optional[float] = 1000.0
    cash_collections: Optional[float] = 0.0
    expenses: Optional[float] = 0.0
    expense_description: Optional[str] = "Electricity bill"
    stock_purchases: Optional[float] = 0.0
    stock_item: Optional[str] = "Milk Packets"
    stock_quantity_purchased: Optional[int] = 20
    stock_quantity_sold: Optional[int] = 15
    notes: Optional[str] = "Daily closing confirmed via Voice Saathi"

class TTSRequest(BaseModel):
    text: str
    language_code: str = "te-IN"
    speaker: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    language_code: str = "te-IN"
    session_id: Optional[str] = "default"
    flow_state: Optional[Dict[str, Any]] = None

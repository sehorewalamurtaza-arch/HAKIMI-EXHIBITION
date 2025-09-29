from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
import uuid
import os
import logging
from pathlib import Path
from enum import Enum
from decimal import Decimal
import hashlib

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'badshah-hakimi-pos-system-secret-key-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for POS system

# Simple password hashing
def get_password_hash(password: str) -> str:
    """Hash password using SHA-256 with salt for security"""
    salt = "badshah_hakimi_pos_salt_2024"
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return get_password_hash(plain_password) == hashed_password

security = HTTPBearer()

# Create FastAPI app
app = FastAPI(title="Badshah-Hakimi POS System", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    CASHIER = "cashier"
    INVENTORY = "inventory"

class OrderStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"

# Pydantic Models
class UserBase(BaseModel):
    username: str
    full_name: str
    role: UserRole = UserRole.CASHIER
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginData(BaseModel):
    username: str
    password: str

# Product Models
class ProductVariation(BaseModel):
    name: str  # e.g., "Size", "Color"
    value: str  # e.g., "Large", "Red"
    price_adjustment: float = 0.0
    stock_quantity: int = 0

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: str
    price: float
    cost_price: Optional[float] = None
    barcode: Optional[str] = None
    sku: str
    images: List[str] = []
    variations: List[ProductVariation] = []
    stock_quantity: int = 0
    min_stock_level: int = 10
    status: ProductStatus = ProductStatus.ACTIVE
    tags: List[str] = []
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    cost_price: Optional[float] = None
    barcode: Optional[str] = None
    sku: str
    stock_quantity: int = 0
    min_stock_level: int = 10
    tags: List[str] = []

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: float
    cost_price: Optional[float]
    barcode: Optional[str]
    sku: str
    stock_quantity: int
    min_stock_level: int
    status: ProductStatus
    tags: List[str]
    created_by: str
    created_at: datetime
    updated_at: datetime

# POS Sale Models
class SaleItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    variation_selection: Dict[str, str] = {}

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sale_number: str
    cashier_id: str
    cashier_name: str
    items: List[SaleItem]
    subtotal: float
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    payment_method: str  # "cash", "card", "mobile"
    payment_received: float
    change_given: float = 0.0
    status: OrderStatus = OrderStatus.COMPLETED
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SaleCreate(BaseModel):
    items: List[Dict[str, Any]]  # [{"product_id": "", "quantity": 1}]
    payment_method: str
    payment_received: float
    discount_amount: float = 0.0

class SaleResponse(BaseModel):
    id: str
    sale_number: str
    cashier_id: str
    cashier_name: str
    items: List[SaleItem]
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    payment_method: str
    payment_received: float
    change_given: float
    status: OrderStatus
    created_at: datetime

# Analytics Models
class DashboardStats(BaseModel):
    total_sales: float
    total_transactions: int
    total_products: int
    total_users: int
    low_stock_products: int
    recent_sales: List[Dict[str, Any]]
    top_selling_products: List[Dict[str, Any]]
    sales_chart_data: List[Dict[str, Any]]

# Utility Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_admin_or_inventory_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVENTORY]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Inventory access required"
        )
    return current_user

# Authentication Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    user_dict = user_data.dict()
    user_dict["password_hash"] = get_password_hash(user_data.password)
    del user_dict["password"]
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    
    return UserResponse(**user.dict())

@api_router.post("/auth/login", response_model=Token)
async def login_user(login_data: LoginData):
    user = await db.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# User Management Routes (Admin only)
@api_router.get("/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_admin_user)):
    users = await db.users.find().to_list(1000)
    return [UserResponse(**user) for user in users]

# Product Routes
@api_router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_admin_or_inventory_user)
):
    # Check if SKU already exists
    existing_product = await db.products.find_one({"sku": product_data.sku})
    if existing_product:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    product_dict = product_data.dict()
    product_dict["created_by"] = current_user.id
    
    product = Product(**product_dict)
    await db.products.insert_one(product.dict())
    
    return ProductResponse(**product.dict())

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    barcode: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = {"status": ProductStatus.ACTIVE}
    
    if category:
        query["category"] = category
    if barcode:
        query["barcode"] = barcode
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    return [ProductResponse(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(**product)

# POS Sale Routes
@api_router.post("/sales", response_model=SaleResponse)
async def create_sale(
    sale_data: SaleCreate,
    current_user: User = Depends(get_current_user)
):
    # Generate sale number
    sale_number = f"SALE-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Process sale items
    sale_items = []
    subtotal = 0.0
    
    for item_data in sale_data.items:
        product = await db.products.find_one({"id": item_data["product_id"]})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data['product_id']} not found")
        
        # Check stock
        if product["stock_quantity"] < item_data["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product['name']}")
        
        unit_price = product["price"]
        total_price = unit_price * item_data["quantity"]
        subtotal += total_price
        
        sale_item = SaleItem(
            product_id=item_data["product_id"],
            product_name=product["name"],
            quantity=item_data["quantity"],
            unit_price=unit_price,
            total_price=total_price,
            variation_selection=item_data.get("variation_selection", {})
        )
        sale_items.append(sale_item)
        
        # Update product stock
        await db.products.update_one(
            {"id": item_data["product_id"]},
            {"$inc": {"stock_quantity": -item_data["quantity"]}}
        )
    
    # Calculate totals
    discount_amount = sale_data.discount_amount
    after_discount = subtotal - discount_amount
    tax_amount = after_discount * 0.05  # 5% tax
    total_amount = after_discount + tax_amount
    
    # Calculate change
    change_given = max(0, sale_data.payment_received - total_amount)
    
    # Create sale
    sale = Sale(
        sale_number=sale_number,
        cashier_id=current_user.id,
        cashier_name=current_user.full_name,
        items=[item.dict() for item in sale_items],
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        payment_method=sale_data.payment_method,
        payment_received=sale_data.payment_received,
        change_given=change_given
    )
    
    await db.sales.insert_one(sale.dict())
    
    return SaleResponse(**sale.dict())

@api_router.get("/sales", response_model=List[SaleResponse])
async def get_sales(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    if current_user.role == UserRole.ADMIN:
        sales = await db.sales.find().skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    else:
        # Cashiers can only see their own sales
        sales = await db.sales.find({"cashier_id": current_user.id}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    return [SaleResponse(**sale) for sale in sales]

# Analytics Routes
@api_router.get("/analytics/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_admin_user)):
    # Calculate stats
    total_sales = await db.sales.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]).to_list(1)
    total_sales = total_sales[0]["total"] if total_sales else 0.0
    
    total_transactions = await db.sales.count_documents({})
    total_products = await db.products.count_documents({"status": "active"})
    total_users = await db.users.count_documents({})
    low_stock_products = await db.products.count_documents({
        "$expr": {"$lte": ["$stock_quantity", "$min_stock_level"]}
    })
    
    # Get recent sales
    recent_sales = await db.sales.find().sort("created_at", -1).limit(5).to_list(5)
    
    # Get top selling products
    top_selling = await db.sales.aggregate([
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "total_quantity": {"$sum": "$items.quantity"},
            "product_name": {"$first": "$items.product_name"}
        }},
        {"$sort": {"total_quantity": -1}},
        {"$limit": 5}
    ]).to_list(5)
    
    # Sales chart data (last 7 days)
    sales_chart = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        daily_sales = await db.sales.aggregate([
            {
                "$match": {
                    "created_at": {
                        "$gte": date.replace(hour=0, minute=0, second=0),
                        "$lt": date.replace(hour=23, minute=59, second=59)
                    }
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]).to_list(1)
        
        sales_chart.append({
            "date": date.strftime("%Y-%m-%d"),
            "sales": daily_sales[0]["total"] if daily_sales else 0.0
        })
    
    return DashboardStats(
        total_sales=total_sales,
        total_transactions=total_transactions,
        total_products=total_products,
        total_users=total_users,
        low_stock_products=low_stock_products,
        recent_sales=recent_sales,
        top_selling_products=top_selling,
        sales_chart_data=list(reversed(sales_chart))
    )

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
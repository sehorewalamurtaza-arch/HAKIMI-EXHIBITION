from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid
import os
import logging
from pathlib import Path
from enum import Enum
from decimal import Decimal

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create FastAPI app
app = FastAPI(title="Badshah-Hakimi Exhibition Sales Platform", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    VENDOR = "vendor"
    CUSTOMER = "customer"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.CUSTOMER
    phone: Optional[str] = None
    address: Optional[str] = None

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
    email: EmailStr
    password: str

# Exhibition Models
class Exhibition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str
    organizer_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ExhibitionCreate(BaseModel):
    name: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str

class ExhibitionResponse(BaseModel):
    id: str
    name: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str
    organizer_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

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
    sku: str
    vendor_id: str
    exhibition_id: str
    images: List[str] = []
    variations: List[ProductVariation] = []
    stock_quantity: int = 0
    min_stock_level: int = 10
    status: ProductStatus = ProductStatus.ACTIVE
    tags: List[str] = []
    specifications: Dict[str, Any] = {}
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None  # {"length": 10, "width": 5, "height": 3}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    price: float
    cost_price: Optional[float] = None
    sku: str
    exhibition_id: str
    images: List[str] = []
    variations: List[ProductVariation] = []
    stock_quantity: int = 0
    min_stock_level: int = 10
    tags: List[str] = []
    specifications: Dict[str, Any] = {}
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: float
    cost_price: Optional[float]
    sku: str
    vendor_id: str
    exhibition_id: str
    images: List[str]
    variations: List[ProductVariation]
    stock_quantity: int
    min_stock_level: int
    status: ProductStatus
    tags: List[str]
    specifications: Dict[str, Any]
    weight: Optional[float]
    dimensions: Optional[Dict[str, float]]
    created_at: datetime
    updated_at: datetime

# Cart and Order Models
class CartItem(BaseModel):
    product_id: str
    quantity: int
    variation_selection: Dict[str, str] = {}  # {"Size": "Large", "Color": "Red"}
    unit_price: float
    total_price: float

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    items: List[CartItem] = []
    total_amount: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    variation_selection: Dict[str, str] = {}

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_id: str
    items: List[OrderItem]
    subtotal: float
    tax_amount: float = 0.0
    shipping_amount: float = 0.0
    total_amount: float
    status: OrderStatus = OrderStatus.PENDING
    shipping_address: Dict[str, str]
    billing_address: Dict[str, str]
    payment_method: str
    payment_status: str = "pending"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    items: List[Dict[str, Any]]  # [{"product_id": "", "quantity": 1, "variation_selection": {}}]
    shipping_address: Dict[str, str]
    billing_address: Dict[str, str]
    payment_method: str
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    items: List[OrderItem]
    subtotal: float
    tax_amount: float
    shipping_amount: float
    total_amount: float
    status: OrderStatus
    shipping_address: Dict[str, str]
    billing_address: Dict[str, str]
    payment_method: str
    payment_status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]

# Analytics Models
class DashboardStats(BaseModel):
    total_sales: float
    total_orders: int
    total_products: int
    total_customers: int
    low_stock_products: int
    recent_orders: List[Dict[str, Any]]
    top_selling_products: List[Dict[str, Any]]
    sales_chart_data: List[Dict[str, Any]]

# Utility Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_vendor_or_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.VENDOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Authentication Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
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
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
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

# Exhibition Routes
@api_router.post("/exhibitions", response_model=ExhibitionResponse)
async def create_exhibition(
    exhibition_data: ExhibitionCreate,
    current_user: User = Depends(get_admin_user)
):
    exhibition_dict = exhibition_data.dict()
    exhibition_dict["organizer_id"] = current_user.id
    
    exhibition = Exhibition(**exhibition_dict)
    await db.exhibitions.insert_one(exhibition.dict())
    
    return ExhibitionResponse(**exhibition.dict())

@api_router.get("/exhibitions", response_model=List[ExhibitionResponse])
async def get_exhibitions():
    exhibitions = await db.exhibitions.find({"is_active": True}).to_list(1000)
    return [ExhibitionResponse(**exhibition) for exhibition in exhibitions]

@api_router.get("/exhibitions/{exhibition_id}", response_model=ExhibitionResponse)
async def get_exhibition(exhibition_id: str):
    exhibition = await db.exhibitions.find_one({"id": exhibition_id})
    if not exhibition:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    return ExhibitionResponse(**exhibition)

# Product Routes
@api_router.post("/products", response_model=ProductResponse)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_vendor_or_admin_user)
):
    # Check if exhibition exists
    exhibition = await db.exhibitions.find_one({"id": product_data.exhibition_id})
    if not exhibition:
        raise HTTPException(status_code=404, detail="Exhibition not found")
    
    # Check if SKU already exists
    existing_product = await db.products.find_one({"sku": product_data.sku})
    if existing_product:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    product_dict = product_data.dict()
    product_dict["vendor_id"] = current_user.id
    
    product = Product(**product_dict)
    await db.products.insert_one(product.dict())
    
    return ProductResponse(**product.dict())

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    exhibition_id: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {"status": ProductStatus.ACTIVE}
    
    if exhibition_id:
        query["exhibition_id"] = exhibition_id
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
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

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductCreate,
    current_user: User = Depends(get_vendor_or_admin_user)
):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check permissions
    if current_user.role == UserRole.VENDOR and product["vendor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = product_data.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated_product = await db.products.find_one({"id": product_id})
    return ProductResponse(**updated_product)

# Cart Routes
@api_router.post("/cart/add")
async def add_to_cart(
    product_id: str,
    quantity: int,
    variation_selection: Dict[str, str] = {},
    current_user: User = Depends(get_current_user)
):
    # Get product
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate price based on variations
    unit_price = product["price"]
    for variation in product.get("variations", []):
        if variation["name"] in variation_selection and variation["value"] == variation_selection[variation["name"]]:
            unit_price += variation["price_adjustment"]
    
    total_price = unit_price * quantity
    
    # Get or create cart
    cart = await db.carts.find_one({"customer_id": current_user.id})
    if not cart:
        cart = Cart(customer_id=current_user.id)
        await db.carts.insert_one(cart.dict())
    
    # Check if item already exists in cart
    item_found = False
    for i, item in enumerate(cart.get("items", [])):
        if item["product_id"] == product_id and item["variation_selection"] == variation_selection:
            cart["items"][i]["quantity"] += quantity
            cart["items"][i]["total_price"] = cart["items"][i]["quantity"] * unit_price
            item_found = True
            break
    
    if not item_found:
        cart_item = CartItem(
            product_id=product_id,
            quantity=quantity,
            variation_selection=variation_selection,
            unit_price=unit_price,
            total_price=total_price
        )
        if "items" not in cart:
            cart["items"] = []
        cart["items"].append(cart_item.dict())
    
    # Update cart total
    cart["total_amount"] = sum(item["total_price"] for item in cart["items"])
    cart["updated_at"] = datetime.utcnow()
    
    await db.carts.update_one(
        {"customer_id": current_user.id},
        {"$set": cart}
    )
    
    return {"message": "Item added to cart successfully"}

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"customer_id": current_user.id})
    if not cart:
        return Cart(customer_id=current_user.id).dict()
    return cart

# Order Routes
@api_router.post("/orders", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user)
):
    # Generate order number
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Process order items
    order_items = []
    subtotal = 0.0
    
    for item_data in order_data.items:
        product = await db.products.find_one({"id": item_data["product_id"]})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data['product_id']} not found")
        
        # Check stock
        if product["stock_quantity"] < item_data["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product['name']}")
        
        # Calculate price
        unit_price = product["price"]
        for variation in product.get("variations", []):
            variation_selection = item_data.get("variation_selection", {})
            if variation["name"] in variation_selection and variation["value"] == variation_selection[variation["name"]]:
                unit_price += variation["price_adjustment"]
        
        total_price = unit_price * item_data["quantity"]
        subtotal += total_price
        
        order_item = OrderItem(
            product_id=item_data["product_id"],
            product_name=product["name"],
            quantity=item_data["quantity"],
            unit_price=unit_price,
            total_price=total_price,
            variation_selection=item_data.get("variation_selection", {})
        )
        order_items.append(order_item)
        
        # Update product stock
        await db.products.update_one(
            {"id": item_data["product_id"]},
            {"$inc": {"stock_quantity": -item_data["quantity"]}}
        )
    
    # Calculate tax and shipping (you can customize this logic)
    tax_amount = subtotal * 0.1  # 10% tax
    shipping_amount = 25.0 if subtotal < 500 else 0.0  # Free shipping over $500
    total_amount = subtotal + tax_amount + shipping_amount
    
    # Create order
    order = Order(
        order_number=order_number,
        customer_id=current_user.id,
        items=[item.dict() for item in order_items],
        subtotal=subtotal,
        tax_amount=tax_amount,
        shipping_amount=shipping_amount,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        billing_address=order_data.billing_address,
        payment_method=order_data.payment_method,
        notes=order_data.notes
    )
    
    await db.orders.insert_one(order.dict())
    
    # Clear user's cart
    await db.carts.delete_one({"customer_id": current_user.id})
    
    return OrderResponse(**order.dict())

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        orders = await db.orders.find().to_list(1000)
    else:
        orders = await db.orders.find({"customer_id": current_user.id}).to_list(1000)
    
    return [OrderResponse(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and order["customer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return OrderResponse(**order)

# Analytics Routes
@api_router.get("/analytics/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_admin_user)):
    # Calculate stats
    total_sales = await db.orders.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]).to_list(1)
    total_sales = total_sales[0]["total"] if total_sales else 0.0
    
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({"status": "active"})
    total_customers = await db.users.count_documents({"role": "customer"})
    low_stock_products = await db.products.count_documents({
        "$expr": {"$lte": ["$stock_quantity", "$min_stock_level"]}
    })
    
    # Get recent orders
    recent_orders = await db.orders.find().sort("created_at", -1).limit(5).to_list(5)
    
    # Get top selling products
    top_selling = await db.orders.aggregate([
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
    from datetime import timedelta
    sales_chart = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        daily_sales = await db.orders.aggregate([
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
        total_orders=total_orders,
        total_products=total_products,
        total_customers=total_customers,
        low_stock_products=low_stock_products,
        recent_orders=recent_orders,
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
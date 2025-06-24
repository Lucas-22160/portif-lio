from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class OrderStatus(str, Enum):
    PENDENTE = "Pendente"
    PREPARANDO = "Preparando"
    PRONTO = "Pronto"
    ENTREGUE = "Entregue"

# Models
class Flavor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    description: str

class OrderItem(BaseModel):
    flavor_name: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    total_amount: float
    status: OrderStatus = OrderStatus.PENDENTE
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    total_amount: float
    notes: Optional[str] = None

class OrderUpdate(BaseModel):
    status: OrderStatus

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    rating: int = Field(ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(BaseModel):
    customer_name: str
    rating: int = Field(ge=1, le=5)
    comment: str

# Initialize flavors data
INITIAL_FLAVORS = [
    {"name": "Misto", "price": 8.0, "description": "Queijo e presunto"},
    {"name": "Carne", "price": 9.0, "description": "Carne moída temperada"},
    {"name": "Calabresa", "price": 9.0, "description": "Calabresa defumada"},
    {"name": "Calabresa com Queijo", "price": 10.0, "description": "Calabresa defumada com queijo"},
    {"name": "Carne com Queijo", "price": 10.0, "description": "Carne moída temperada com queijo"},
    {"name": "Frango", "price": 9.0, "description": "Frango desfiado temperado"},
    {"name": "Frango com Queijo", "price": 10.0, "description": "Frango desfiado com queijo"},
    {"name": "Carne Seca", "price": 12.0, "description": "Carne seca desfiada com cebola"},
    {"name": "Tudão", "price": 15.0, "description": "Queijo, presunto, calabresa, frango e carne"},
    {"name": "4 Queijos", "price": 13.0, "description": "Mussarela, provolone, cheddar e catupiry"}
]

# Routes
@api_router.get("/")
async def root():
    return {"message": "Pastelaria API - Bem vindos!"}

# Flavors endpoints
@api_router.get("/flavors", response_model=List[Flavor])
async def get_flavors():
    flavors = await db.flavors.find().to_list(1000)
    if not flavors:
        # Initialize flavors if empty
        flavor_objects = [Flavor(**flavor) for flavor in INITIAL_FLAVORS]
        await db.flavors.insert_many([flavor.dict() for flavor in flavor_objects])
        return flavor_objects
    return [Flavor(**flavor) for flavor in flavors]

# Orders endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    order_dict = order_data.dict()
    order_obj = Order(**order_dict)
    await db.orders.insert_one(order_obj.dict())
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find().sort("created_at", -1).to_list(1000)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return Order(**order)

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_update: OrderUpdate):
    update_data = order_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.orders.update_one(
        {"id": order_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    
    updated_order = await db.orders.find_one({"id": order_id})
    return Order(**updated_order)

# Reviews endpoints
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate):
    review_dict = review_data.dict()
    review_obj = Review(**review_dict)
    await db.reviews.insert_one(review_obj.dict())
    return review_obj

@api_router.get("/reviews", response_model=List[Review])
async def get_reviews():
    reviews = await db.reviews.find().sort("created_at", -1).to_list(1000)
    return [Review(**review) for review in reviews]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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
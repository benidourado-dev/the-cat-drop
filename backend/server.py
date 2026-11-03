from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

import bcrypt
import httpx
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from starlette.middleware.cors import CORSMiddleware

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie(key="access_token", value=create_access_token(user_id, email),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user_id),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")


PyObjectId = Annotated[str, BeforeValidator(str)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: PyObjectId = Field(default_factory=lambda: str(ObjectId()), alias="_id", serialization_alias="id")

    def to_mongo(self):
        doc = self.model_dump(by_alias=True)
        doc["_id"] = ObjectId(doc.pop("id"))
        for k, v in doc.items():
            if isinstance(v, datetime):
                doc[k] = v.isoformat()
        return doc

    @classmethod
    def from_mongo(cls, doc):
        doc = dict(doc)
        doc["_id"] = str(doc["_id"])
        return cls(**doc)


class User(BaseDocument):
    email: str
    name: str = "Admin"
    role: str = "admin"
    password_hash: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Product(BaseDocument):
    name: str
    category: str
    price: float
    original_price: float
    image_url: str
    affiliate_link: str
    featured: bool = False
    mascot_quote: str = ""
    coupon: Optional[str] = None
    clicks: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    original_price: float
    image_url: str
    affiliate_link: str
    featured: bool = False
    mascot_quote: str = ""
    coupon: Optional[str] = None


class LoginInput(BaseModel):
    email: str
    password: str


app = FastAPI()
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "The Cat Drop API"}


async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    if session_token:
        session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session_doc:
            expires_at = session_doc["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            user = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
            if user:
                user.pop("password_hash", None)
                return user
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@api_router.post("/auth/login")
async def login(input: LoginInput, request: Request, response: Response):
    email = input.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("attempts", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 15 minutos.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"attempts": 1}, "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, str(user["_id"]), user["email"])
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "logged out"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": user.get("user_id") or user.get("_id"),
        "email": user["email"],
        "name": user.get("name", "Admin"),
        "role": user.get("role", "admin"),
        "picture": user.get("picture"),
    }


@api_router.post("/auth/google")
async def google_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")

    data = resp.json()
    email = data["email"].lower().strip()

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    role = "admin" if email == admin_email else "viewer"

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing.get("user_id") or f"user_{uuid.uuid4().hex[:12]}"
        await db.users.update_one(
            {"email": email},
            {"$set": {"user_id": user_id, "name": data.get("name", "Admin"), "picture": data.get("picture"), "role": role}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", "Admin"),
            "picture": data.get("picture"),
            "role": role,
            "password_hash": "",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", max_age=604800, path="/",
    )
    return {"id": user_id, "email": email, "name": data.get("name", "Admin"), "role": role, "picture": data.get("picture")}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie(key="access_token", value=create_access_token(str(user["_id"]), user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"message": "refreshed"}


@api_router.get("/products", response_model=List[Product])
async def list_products():
    docs = await db.products.find({}).sort([("featured", -1), ("created_at", -1)]).to_list(1000)
    return [Product.from_mongo(d) for d in docs]


@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate, user: dict = Depends(get_current_user)):
    product = Product(**input.model_dump())
    await db.products.insert_one(product.to_mongo())
    return product


@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductCreate, user: dict = Depends(get_current_user)):
    result = await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": input.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    doc = await db.products.find_one({"_id": ObjectId(product_id)})
    return Product.from_mongo(doc)


@api_router.post("/products/{product_id}/click")
async def track_click(product_id: str):
    result = await db.products.update_one({"_id": ObjectId(product_id)}, {"$inc": {"clicks": 1}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"message": "click tracked"}


@api_router.get("/stats/clicks")
async def click_stats(user: dict = Depends(get_current_user)):
    docs = await db.products.find({}, {"name": 1, "clicks": 1, "category": 1, "price": 1}).sort("clicks", -1).to_list(1000)
    return [{"id": str(d["_id"]), "name": d["name"], "clicks": d.get("clicks", 0), "category": d["category"], "price": d["price"]} for d in docs]


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"message": "deleted"}


SEED_PRODUCTS = [
    {"name": "Headphone Sem Fio Bluetooth Noise Cancelling", "category": "Tech & Gadgets", "price": 129.90, "original_price": 299.00,
     "image_url": "https://images.unsplash.com/photo-1605170876472-db58e15c430e?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": True,
     "mascot_quote": "Som de estúdio por preço de fone de camelô. O Gato aprovou.", "coupon": "GATO10"},
    {"name": "Fone Earbuds TWS Minimalist Studio", "category": "Tech & Gadgets", "price": 79.90, "original_price": 180.00,
     "image_url": "https://images.unsplash.com/photo-1677346414290-d337cbc682a6?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": True,
     "mascot_quote": "Pequeno, potente e barato. Meu achado da semana.", "coupon": None},
    {"name": "Ring Light LED de Mesa para Smartphone", "category": "Tech & Gadgets", "price": 49.90, "original_price": 110.00,
     "image_url": "https://images.unsplash.com/photo-1760604359299-e4273ee2015a?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": False,
     "mascot_quote": "Luz de influencer por menos de R$50.", "coupon": None},
    {"name": "Luminária de Mesa Escultórica Orgânica", "category": "Casa & Cozinha", "price": 89.90, "original_price": 199.00,
     "image_url": "https://images.unsplash.com/photo-1667312939978-64cf31718a6e?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": False,
     "mascot_quote": "Casa com cara de Pinterest, preço de garimpagem.", "coupon": None},
    {"name": "Organizador Minimalista em Cerâmica Escura", "category": "Casa & Cozinha", "price": 39.90, "original_price": 85.00,
     "image_url": "https://images.unsplash.com/photo-1617214922084-5db8d3c3df5a?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": False,
     "mascot_quote": "Arruma a bancada e a vida.", "coupon": None},
    {"name": "Tênis Streetwear Chunky Sole Retro", "category": "Moda & Estilo", "price": 149.90, "original_price": 349.00,
     "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": True,
     "mascot_quote": "O drop mais pedido. Correu, é seu.", "coupon": "CATDROP15"},
    {"name": "Sneaker Urban Classic High-Quality", "category": "Moda & Estilo", "price": 119.90, "original_price": 260.00,
     "image_url": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?crop=entropy&cs=srgb&fm=jpg&q=85",
     "affiliate_link": "https://shopee.com.br", "featured": False,
     "mascot_quote": "Clássico que combina com tudo.", "coupon": None},
]


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        user = User(email=admin_email, password_hash=hash_password(admin_password))
        await db.users.insert_one(user.to_mongo())
        logger.info("Admin user seeded")


async def seed_products():
    count = await db.products.count_documents({})
    if count == 0:
        await db.products.insert_many([Product(**p).to_mongo() for p in SEED_PRODUCTS])
        logger.info("Seed products inserted")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.user_sessions.create_index("session_token", unique=True)
    await db.products.update_many({"clicks": {"$exists": False}}, {"$set": {"clicks": 0}})
    await seed_admin()
    await seed_products()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

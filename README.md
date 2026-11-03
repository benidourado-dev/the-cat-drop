# The Cat Drop

Site de afiliados da Shopee com o Gato Preto como personagem de vendas. Catálogo de achadinhos com links de comissão, contador de cliques, painel admin com login por senha e Google.

---

## Índice

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Backend (FastAPI)](#backend-fastapi)
3. [Frontend (React)](#frontend-react)
4. [Banco de Dados (MongoDB)](#banco-de-dados-mongodb)
5. [Autenticação](#autenticação)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Como Rodar](#como-rodar)

---

## Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py          # API FastAPI completa
│   ├── requirements.txt   # Dependências Python
│   └── .env               # Variáveis (não versionar)
├── frontend/
│   ├── src/
│   │   ├── App.js                  # Rotas principais
│   │   ├── index.css               # Estilos globais + fontes
│   │   ├── lib/api.js              # Cliente axios
│   │   ├── pages/
│   │   │   ├── Home.js             # Página pública
│   │   │   ├── Admin.js            # Painel admin
│   │   │   └── AuthCallback.js     # Callback Google OAuth
│   │   └── components/
│   │       ├── Header.js           # Navbar
│   │       ├── Hero.js             # Hero com mascote
│   │       ├── Marquee.js          # Letreiro animado
│   │       ├── FeaturedDrops.js    # Ofertas do dia
│   │       ├── Catalog.js          # Catálogo com filtros
│   │       ├── ProductCard.js      # Card de produto
│   │       ├── PaymentSection.js   # Formas de pagamento
│   │       ├── MascotSection.js    # Sobre o Gato
│   │       └── Footer.js           # Rodapé com contatos
│   ├── package.json
│   └── .env                        # REACT_APP_BACKEND_URL
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

---

## Backend (FastAPI)

### `/app/backend/server.py` — Completo

```python
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
    extra_admin = "benidourado@gmail.com"
    role = "admin" if email in (admin_email, extra_admin) else "viewer"

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
```

### `/app/backend/requirements.txt`

```
fastapi==0.110.1
uvicorn==0.25.0
boto3>=1.34.129
requests-oauthlib>=2.0.0
cryptography>=42.0.8
python-dotenv>=1.0.1
pymongo==4.18.2
pydantic>=2.6.4
email-validator>=2.2.0
pyjwt>=2.10.1
bcrypt==4.1.3
passlib>=1.7.4
tzdata>=2024.2
motor==3.7.1
pytest>=8.0.0
pytest-xdist>=3.6.0
black>=24.1.1
isort>=5.13.2
flake8>=7.0.0
mypy>=1.8.0
python-jose>=3.3.0
requests>=2.31.0
pandas>=2.2.0
numpy>=1.26.0
python-multipart>=0.0.9
jq>=1.6.0
typer>=0.9.0
emergentintegrations==0.2.2
httpx>=0.27.0
```

---

## Frontend (React)

### `/app/frontend/src/App.js`

```javascript
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AuthCallback from "./pages/AuthCallback";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-[#0B0C10]">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster theme="dark" richColors position="bottom-right" />
    </div>
  );
}

export default App;
```

### `/app/frontend/src/lib/api.js`

```javascript
import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});
```

### `/app/frontend/src/pages/Home.js`

```javascript
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { FeaturedDrops } from "../components/FeaturedDrops";
import { Catalog } from "../components/Catalog";
import { PaymentSection } from "../components/PaymentSection";
import { MascotSection } from "../components/MascotSection";
import { Footer } from "../components/Footer";
import { api } from "../lib/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#0B0C10] text-[#F4F4F6] min-h-screen">
      <Header />
      <main>
        <Hero />
        <Marquee />
        {loading ? (
          <div data-testid="products-loading" className="max-w-7xl mx-auto px-4 py-24 text-center text-zinc-500 text-sm">
            O Gato está trazendo os achadinhos...
          </div>
        ) : (
          <>
            <FeaturedDrops products={products} />
            <Catalog products={products} />
          </>
        )}
        <PaymentSection />
        <MascotSection />
      </main>
      <Footer />
    </div>
  );
}
```

### `/app/frontend/src/pages/AuthCallback.js`

```javascript
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const sessionId = new URLSearchParams(location.hash.replace("#", "")).get("session_id");
    if (!sessionId) {
      navigate("/admin", { replace: true });
      return;
    }

    api.post("/auth/google", { session_id: sessionId })
      .then((res) => {
        navigate("/admin", { replace: true, state: { user: res.data } });
      })
      .catch(() => {
        navigate("/admin", { replace: true });
      });
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
      <div className="text-center" data-testid="auth-callback-loading">
        <div className="w-10 h-10 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Entrando com o Google...</p>
      </div>
    </div>
  );
}
```

### `/app/frontend/src/pages/Admin.js`

```javascript
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Cat, LogOut, Plus, Pencil, Trash2, X, ArrowLeft, Star, MousePointerClick, Trophy } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const loginWithGoogle = () => {
  const redirectUrl = window.location.origin + "/admin";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

const emptyForm = {
  name: "", category: "Tech & Gadgets", price: "", original_price: "",
  image_url: "", affiliate_link: "", featured: false, mascot_quote: "", coupon: null,
};

const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Admin() {
  const location = useLocation();
  const [user, setUser] = useState(location.state?.user || null);
  const [checking, setChecking] = useState(!location.state?.user);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const totalClicks = products.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const topProducts = [...products].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 3);

  const loadProducts = () => api.get("/products").then((res) => setProducts(res.data)).catch(() => {});

  useEffect(() => {
    if (location.state?.user) { loadProducts(); return; }
    api.get("/auth/me")
      .then((res) => { setUser(res.data); loadProducts(); })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const doLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", loginForm);
      setUser(res.data);
      loadProducts();
      toast.success(`Bem-vindo de volta, ${res.data.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Falha no login");
    }
  };

  const doLogout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    toast.success("Sessão encerrada");
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(String(form.price).replace(",", ".")),
      original_price: parseFloat(String(form.original_price).replace(",", ".")),
      coupon: null,
      image_url: form.image_url || "https://images.unsplash.com/photo-1605170876472-db58e15c430e?crop=entropy&cs=srgb&fm=jpg&q=85",
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success("Produto atualizado!");
      } else {
        await api.post("/products", payload);
        toast.success("Produto adicionado ao catálogo!");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao salvar produto");
    }
  };

  const startEdit = (p) => {
    setForm({ ...p, price: String(p.price), original_price: String(p.original_price), coupon: null });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeProduct = async (p) => {
    if (!window.confirm(`Remover "${p.name}" do catálogo?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success("Produto removido");
      loadProducts();
    } catch {
      toast.error("Erro ao remover produto");
    }
  };

  const inputCls = "w-full rounded-xl bg-[#0B0C10] border border-white/10 focus:border-[#FFB800]/50 focus:outline-none px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors";

  if (checking) {
    return <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center text-zinc-500 text-sm">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0C10] noise-dots flex items-center justify-center px-4">
        <div data-testid="admin-login-card" className="w-full max-w-sm rounded-3xl bg-[#12141A] border border-white/10 p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center">
              <Cat className="w-5 h-5 text-[#0B0C10]" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold text-lg">THE CAT <span className="text-[#FFB800]">DROP</span></span>
          </div>
          <p className="text-sm text-zinc-500 mb-7">Área restrita do lojista.</p>
          <button onClick={loginWithGoogle} data-testid="google-login-btn"
            className="w-full flex items-center justify-center gap-3 rounded-full bg-white hover:bg-zinc-200 text-zinc-900 font-bold text-sm py-3 transition-colors mb-5">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Entrar com Google
          </button>
          <div className="flex items-center gap-3 mb-5">
            <span className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-jetbrains uppercase tracking-widest text-zinc-600">ou com senha</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>
          <form onSubmit={doLogin} className="space-y-4">
            <input type="email" required placeholder="E-mail" value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              data-testid="admin-login-email" className={inputCls} />
            <input type="password" required placeholder="Senha" value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              data-testid="admin-login-password" className={inputCls} />
            <button type="submit" data-testid="admin-login-submit"
              className="w-full rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm py-3 transition-colors">
              Entrar no painel
            </button>
          </form>
          <Link to="/" data-testid="back-to-site-link" className="mt-6 flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-[#FFB800] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      <header className="border-b border-white/10 bg-[#12141A]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center">
              <Cat className="w-4 h-4 text-[#0B0C10]" strokeWidth={2.5} />
            </span>
            <span className="font-display font-extrabold">Painel do Gato</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" data-testid="view-store-link" className="text-xs font-semibold text-zinc-400 hover:text-[#FFB800] transition-colors">
              Ver loja
            </Link>
            <button onClick={doLogout} data-testid="admin-logout-btn"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 hover:border-[#FF6B00]/50 rounded-full px-4 py-1.5 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="click-stats-grid">
          <div className="rounded-2xl bg-[#12141A] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-1">
              <MousePointerClick className="w-4 h-4 text-[#FF6B00]" />
              <p className="text-[10px] font-jetbrains uppercase tracking-widest text-zinc-500">cliques totais</p>
            </div>
            <p className="font-display font-extrabold text-3xl text-[#FFB800]" data-testid="total-clicks-value">{totalClicks}</p>
          </div>
          <div className="rounded-2xl bg-[#12141A] border border-white/10 p-5 col-span-1 lg:col-span-3">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#FFB800]" />
              <p className="text-[10px] font-jetbrains uppercase tracking-widest text-zinc-500">top 3 mais clicados</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {topProducts.map((p, i) => (
                <p key={p.id} className="text-xs text-zinc-300" data-testid={`top-product-${i}`}>
                  <span className="text-[#FF6B00] font-jetbrains font-bold">#{i + 1}</span>{" "}
                  {p.name.length > 34 ? p.name.slice(0, 34) + "…" : p.name}{" "}
                  <span className="text-[#FFB800] font-bold">({p.clicks || 0})</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">Produtos</h1>
            <p className="text-sm text-zinc-500 mt-1">{products.length} achadinhos no catálogo</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(!showForm); }} data-testid="toggle-product-form-btn"
            className="flex items-center gap-2 rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm px-5 py-2.5 transition-colors">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Fechar" : "Novo produto"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={submitProduct} data-testid="product-form"
            className="rounded-3xl bg-[#12141A] border border-white/10 p-6 sm:p-8 mb-10 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <h2 className="font-display font-bold text-lg mb-1">{editingId ? "Editar produto" : "Novo achadinho"}</h2>
              <p className="text-xs text-zinc-500">Cole aqui o link de afiliado gerado no seu painel da Shopee.</p>
            </div>
            <input required placeholder="Nome do produto" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="product-name-input" className={inputCls} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              data-testid="product-category-select" className={inputCls}>
              {["Tech & Gadgets", "Casa & Cozinha", "Moda & Estilo", "Fitness & Suplementos", "Ferramentas", "Beleza & Cuidados", "Pets", "Outros"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input required placeholder="Preço promocional (ex: 129.90)" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} data-testid="product-price-input" className={inputCls} />
            <input required placeholder="Preço original (ex: 299.00)" value={form.original_price}
              onChange={(e) => setForm({ ...form, original_price: e.target.value })} data-testid="product-original-price-input" className={inputCls} />
            <input required placeholder="Link de afiliado Shopee" value={form.affiliate_link}
              onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })} data-testid="product-affiliate-input" className={inputCls} />
            <input placeholder="Frase do Gato (opcional)" value={form.mascot_quote}
              onChange={(e) => setForm({ ...form, mascot_quote: e.target.value })} data-testid="product-quote-input" className={inputCls} />
            <label className="sm:col-span-2 flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="product-featured-checkbox"
                className="w-4 h-4 accent-[#FF6B00]" />
              Destacar nas Ofertas do Dia
            </label>
            <button type="submit" data-testid="product-save-btn"
              className="sm:col-span-2 rounded-full bg-[#FFB800] hover:bg-white text-[#0B0C10] font-bold text-sm py-3 transition-colors">
              {editingId ? "Salvar alterações" : "Adicionar produto"}
            </button>
          </form>
        )}

        <div className="space-y-3" data-testid="admin-product-list">
          {products.map((p) => (
            <div key={p.id} data-testid={`admin-product-row-${p.id}`}
              className="flex items-center gap-4 rounded-2xl bg-[#12141A] border border-white/10 p-4">
              <span className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center shrink-0">
                <Cat className="w-5 h-5 text-[#FF6B00]" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.name}</p>
                <p className="text-xs text-zinc-500">
                  {p.category} · <span className="text-[#FFB800] font-semibold">{brl(p.price)}</span>
                  {" "}<span className="line-through">{brl(p.original_price)}</span>
                </p>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-xs font-jetbrains text-zinc-400 border border-white/10 rounded-full px-3 py-1 shrink-0" data-testid={`product-clicks-${p.id}`}>
                <MousePointerClick className="w-3 h-3 text-[#FF6B00]" /> {p.clicks || 0}
              </span>
              {p.featured && <Star className="w-4 h-4 text-[#FFB800] shrink-0" />}
              <button onClick={() => startEdit(p)} data-testid={`edit-product-btn-${p.id}`} aria-label="Editar"
                className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-[#FFB800] hover:border-[#FFB800]/40 transition-colors shrink-0">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => removeProduct(p)} data-testid={`delete-product-btn-${p.id}`} aria-label="Remover"
                className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/40 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

### Componentes

Todos os componentes estão em `/app/frontend/src/components/`:

| Arquivo | O que faz |
|---------|-----------|
| `Header.js` | Navbar fixa com logo, links, badge "Afiliado Shopee" e botão Admin |
| `Hero.js` | Hero com texto animado linha por linha, foto do gato preto, CTAs |
| `Marquee.js` | Letreiro animado com "ACHADINHO DO GATO • ATÉ 70% OFF..." |
| `FeaturedDrops.js` | Seção "Ofertas do Dia" com countdown e produtos em destaque |
| `Catalog.js` | Catálogo completo com busca, filtros de categoria e ordenação |
| `ProductCard.js` | Card de produto sem foto (só nome, preço, desconto, botão Shopee) |
| `PaymentSection.js` | Formas de pagamento: Pix (chave 152074587790), Débito, Crédito, Boleto |
| `MascotSection.js` | Seção "Quem é o Gato do Drop?" com foto e bullets |
| `Footer.js` | Rodapé com contatos (benidourado@gmail.com, WhatsApp) |

### `/app/frontend/src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
    :root {
        --background: 228 20% 5%;
        --foreground: 240 11% 96%;
        --card: 226 20% 8%;
        --card-foreground: 240 11% 96%;
        --popover: 226 20% 8%;
        --popover-foreground: 240 11% 96%;
        --primary: 16 84% 55%;
        --primary-foreground: 0 0% 100%;
        --secondary: 226 16% 12%;
        --secondary-foreground: 240 11% 96%;
        --muted: 226 16% 12%;
        --muted-foreground: 240 5% 65%;
        --accent: 45 100% 50%;
        --accent-foreground: 226 20% 5%;
        --destructive: 0 62.8% 50%;
        --destructive-foreground: 0 0% 98%;
        --border: 0 0% 100% / 0.08;
        --input: 0 0% 100% / 0.1;
        --ring: 45 100% 50%;
        --radius: 0.75rem;
    }
}

@layer base {
    * {
        @apply border-border;
    }
    body {
        background-color: #0B0C10;
        color: #F4F4F6;
        font-family: 'Plus Jakarta Sans', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    html {
        scroll-behavior: smooth;
    }
    ::selection {
        background: rgba(255, 184, 0, 0.35);
        color: #fff;
    }
}

.font-display {
    font-family: 'Syne', sans-serif;
}

.font-jetbrains {
    font-family: 'JetBrains Mono', monospace;
}

.noise-dots {
    background-image: radial-gradient(#1a1d26 1px, transparent 1px);
    background-size: 16px 16px;
}

@keyframes marquee-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}

.animate-marquee {
    animation: marquee-scroll 40s linear infinite;
}

@keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
}

.animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
}

::-webkit-scrollbar {
    width: 10px;
}
::-webkit-scrollbar-track {
    background: #0B0C10;
}
::-webkit-scrollbar-thumb {
    background: #2a2d38;
    border-radius: 8px;
}
::-webkit-scrollbar-thumb:hover {
    background: #FF6B00;
}
```

---

## Banco de Dados (MongoDB)

### Collections

| Collection | Descrição |
|------------|-----------|
| `products` | Produtos do catálogo (20 itens com links de afiliado) |
| `users` | Usuários (admin por senha e Google OAuth) |
| `user_sessions` | Sessões do Google Sign-In (7 dias) |
| `login_attempts` | Controle de brute force no login por senha |

### Schema do Produto

```javascript
{
  _id: ObjectId,
  name: String,           // Nome do produto
  category: String,       // Categoria
  price: Number,          // Preço promocional
  original_price: Number, // Preço original (riscado)
  image_url: String,      // URL da imagem (não exibida no card)
  affiliate_link: String, // Link s.shopee.com.br
  featured: Boolean,      // Destaque nas Ofertas do Dia
  mascot_quote: String,   // Frase do Gato
  coupon: String|null,    // Cupom (removido, sempre null)
  clicks: Number,         // Contador de cliques
  created_at: String      // ISO datetime
}
```

---

## Autenticação

### Login por Senha (JWT)

- `POST /api/auth/login` — email + senha → cookies httpOnly
- Admin seedado: `admin@thecatdrop.com` / `catdrop2026`
- Brute force: 5 tentativas → bloqueio 15 min

### Google Sign-In (Emergent)

1. Botão "Entrar com Google" redireciona para `https://auth.emergentagent.com/?redirect=<origin>/admin`
2. Google autentica e volta com `#session_id=...`
3. `AuthCallback` detecta o hash e chama `POST /api/auth/google`
4. Backend troca session_id por session_token (7 dias)
5. Cookie httpOnly `session_token` é setado

**Admins Google:** `admin@thecatdrop.com` e `benidourado@gmail.com`

---

## Variáveis de Ambiente

### `/app/backend/.env`

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
JWT_SECRET="<64-char-hex>"
ADMIN_EMAIL="admin@thecatdrop.com"
ADMIN_PASSWORD="catdrop2026"
FRONTEND_URL="https://your-app.preview.emergentagent.com"
```

### `/app/frontend/.env`

```
REACT_APP_BACKEND_URL=https://your-app.preview.emergentagent.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## Como Rodar

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

### Acessos

| URL | O que é |
|-----|---------|
| `/` | Loja pública |
| `/admin` | Painel admin (login) |

---

## Contatos do Lojista

- **E-mail:** benidourado@gmail.com
- **WhatsApp:** (97) 3054-829
- **Pix:** 152074587790

---

## Créditos

Desenvolvido com Emergent.

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

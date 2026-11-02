import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cat, LogOut, Plus, Pencil, Trash2, X, ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

const emptyForm = {
  name: "", category: "Tech & Gadgets", price: "", original_price: "",
  image_url: "", affiliate_link: "", featured: false, mascot_quote: "", coupon: "",
};

const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = () => api.get("/products").then((res) => setProducts(res.data)).catch(() => {});

  useEffect(() => {
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
      coupon: form.coupon || null,
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
    setForm({ ...p, price: String(p.price), original_price: String(p.original_price), coupon: p.coupon || "" });
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
            <input required placeholder="URL da imagem" value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })} data-testid="product-image-input" className={inputCls} />
            <input required placeholder="Link de afiliado Shopee" value={form.affiliate_link}
              onChange={(e) => setForm({ ...form, affiliate_link: e.target.value })} data-testid="product-affiliate-input" className={inputCls} />
            <input placeholder="Frase do Gato (opcional)" value={form.mascot_quote}
              onChange={(e) => setForm({ ...form, mascot_quote: e.target.value })} data-testid="product-quote-input" className={inputCls} />
            <input placeholder="Cupom (opcional, ex: GATO10)" value={form.coupon}
              onChange={(e) => setForm({ ...form, coupon: e.target.value })} data-testid="product-coupon-input" className={inputCls} />
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
              <img src={p.image_url} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.name}</p>
                <p className="text-xs text-zinc-500">
                  {p.category} · <span className="text-[#FFB800] font-semibold">{brl(p.price)}</span>
                  {" "}<span className="line-through">{brl(p.original_price)}</span>
                </p>
              </div>
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

import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { ProductCard } from "./ProductCard";

const SORTS = [
  { value: "featured", label: "Drops em destaque" },
  { value: "discount", label: "Maior desconto" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
  { value: "newest", label: "Mais recentes" },
];

export const Catalog = ({ products }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ["Todos", ...cats, "Até R$50"];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = category === "Todos" || (category === "Até R$50" ? p.price <= 50 : p.category === category);
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
    const disc = (p) => 1 - p.price / p.original_price;
    switch (sort) {
      case "discount": list = [...list].sort((a, b) => disc(b) - disc(a)); break;
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "newest": list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      default: list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [products, query, category, sort]);

  return (
    <section id="catalogo" data-testid="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 border-t border-white/5">
      <div className="mb-10">
        <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-3">todos os achadinhos</p>
        <h2 className="font-display font-bold tracking-tight text-2xl sm:text-3xl lg:text-4xl">Catálogo do Gato</h2>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar achadinho..."
            data-testid="catalog-search-input"
            className="w-full rounded-full bg-[#12141A] border border-white/10 focus:border-[#FFB800]/50 focus:outline-none pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors"
          />
        </div>
        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value)} data-testid="catalog-sort-select"
            className="appearance-none rounded-full bg-[#12141A] border border-white/10 focus:border-[#FFB800]/50 focus:outline-none pl-4 pr-10 py-3 text-sm text-zinc-300 cursor-pointer transition-colors">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10" data-testid="category-filters">
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} data-testid={`category-pill-${c.replace(/\s|&/g, '-').toLowerCase()}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              category === c
                ? "bg-[#FFB800] text-[#0B0C10]"
                : "border border-white/10 text-zinc-400 hover:border-[#FFB800]/40 hover:text-[#FFB800]"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div data-testid="catalog-empty" className="text-center py-20 text-zinc-500">
          <p className="font-display font-bold text-xl mb-2">Nenhum achadinho por aqui...</p>
          <p className="text-sm">O Gato ainda está garimpando. Tente outra busca ou categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};

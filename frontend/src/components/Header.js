import { useState } from "react";
import { Link } from "react-router-dom";
import { Cat, Menu, X, ShieldCheck, BadgeCheck } from "lucide-react";

const NAV_LINKS = [
  { label: "Drops do Dia", href: "#drops" },
  { label: "Catálogo", href: "#catalogo" },
  { label: "Pagamento", href: "#pagamento" },
  { label: "O Gato", href: "#o-gato" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header data-testid="site-header" className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0C10]/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="#top" data-testid="brand-logo" className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.45)] group-hover:shadow-[0_0_30px_rgba(255,107,0,0.7)] transition-shadow">
            <Cat className="w-5 h-5 text-[#0B0C10]" strokeWidth={2.5} />
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight">
            THE CAT <span className="text-[#FFB800]">DROP</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8" data-testid="desktop-nav">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} data-testid={`nav-link-${l.href.replace('#', '')}`}
              className="text-sm font-medium text-zinc-400 hover:text-[#FFB800] transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-jetbrains uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-3 py-1.5">
            <BadgeCheck className="w-3.5 h-3.5" /> Afiliado Shopee
          </span>
          <Link to="/admin" data-testid="admin-access-button"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 hover:border-[#FFB800]/50 rounded-full px-4 py-1.5 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </Link>
        </div>

        <button data-testid="mobile-menu-toggle" onClick={() => setOpen(!open)}
          className="md:hidden text-zinc-300 hover:text-white p-2" aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div data-testid="mobile-menu" className="md:hidden border-t border-white/10 backdrop-blur-xl bg-[#0B0C10]/95">
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} data-testid={`mobile-nav-link-${l.href.replace('#', '')}`}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-zinc-300 hover:text-[#FFB800] py-3 border-b border-white/5 transition-colors">
                {l.label}
              </a>
            ))}
            <Link to="/admin" data-testid="mobile-admin-link" onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm font-semibold text-[#FFB800] py-3">
              <ShieldCheck className="w-4 h-4" /> Área Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Cat, Timer } from "lucide-react";
import { api } from "../lib/api";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const trackClick = (id) => {
  api.post(`/products/${id}/click`).catch(() => {});
};

const useCountdown = () => {
  const [left, setLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end - now);
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setLeft(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
};

export const FeaturedDrops = ({ products }) => {
  const countdown = useCountdown();
  const featured = useMemo(() => products.filter((p) => p.featured), [products]);
  const heroDrop = featured[0];
  const others = featured.slice(1, 4);

  if (!products.length || !heroDrop) return null;

  const discount = (p) => Math.round((1 - p.price / p.original_price) * 100);

  return (
    <section id="drops" data-testid="featured-drops-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-3">curadoria fresca</p>
          <h2 className="font-display font-bold tracking-tight text-2xl sm:text-3xl lg:text-4xl">Ofertas do Dia</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#FF6B00]/30 bg-[#FF6B00]/10 px-4 py-2">
          <Timer className="w-4 h-4 text-[#FF6B00]" />
          <span className="text-sm font-jetbrains font-bold text-[#FF6B00]" data-testid="drop-countdown">{countdown}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          data-testid="hero-drop-card"
          className="md:col-span-7 rounded-3xl border border-[#FFB800]/25 bg-gradient-to-br from-[#FFB800]/10 via-[#12141A] to-[#12141A] p-7 sm:p-10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#FF6B00]/10 blur-3xl pointer-events-none" />
          <span className="w-fit rounded-full bg-[#FF6B00] text-white text-xs font-bold px-3 py-1.5 shadow-[0_0_20px_rgba(255,107,0,0.5)] mb-5">
            -{discount(heroDrop)}% OFF
          </span>
          <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-3">drop principal</p>
          <h3 className="font-display font-bold text-xl sm:text-2xl leading-snug mb-4">{heroDrop.name}</h3>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#FFB800]">{brl(heroDrop.price)}</span>
            <span className="text-sm text-zinc-500 line-through">{brl(heroDrop.original_price)}</span>
          </div>
          {heroDrop.mascot_quote && (
            <div className="flex items-start gap-2.5 mt-3 mb-7 rounded-xl bg-white/5 border border-white/10 p-3.5 max-w-md">
              <Cat className="w-4 h-4 text-[#FFB800] mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-300 italic leading-relaxed">"{heroDrop.mascot_quote}"</p>
            </div>
          )}
          <a href={heroDrop.affiliate_link} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(heroDrop.id)} data-testid="hero-drop-shopee-btn"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm px-6 py-3 transition-colors w-fit">
            Ver na Shopee <ExternalLink className="w-4 h-4" />
          </a>
        </motion.div>

        <div className="md:col-span-5 grid gap-5">
          {others.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.08 * (i + 1) }}
              data-testid={`featured-pick-${p.id}`}
              className="rounded-3xl border border-white/10 bg-[#12141A] p-6 flex items-center gap-5 group hover:border-[#FFB800]/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-1.5">escolha do gato</p>
                <h3 className="font-display font-bold text-base leading-snug mb-2 line-clamp-2">{p.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-extrabold text-xl text-[#FFB800]">{brl(p.price)}</span>
                  <span className="text-xs text-zinc-500 line-through">{brl(p.original_price)}</span>
                  <span className="text-[10px] font-bold text-[#10B981]">-{discount(p)}%</span>
                </div>
              </div>
              <a href={p.affiliate_link} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(p.id)}
                data-testid={`featured-shopee-btn-${p.id}`} aria-label="Ver na Shopee"
                className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#FF6B00]/50 text-[#FF6B00] hover:bg-[#FF6B00] hover:text-[#0B0C10] transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

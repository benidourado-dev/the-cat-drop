import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, Ticket, Cat, Timer } from "lucide-react";
import { toast } from "sonner";
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
  const topPick = featured[1] || products[1];
  const couponProduct = products.find((p) => p.coupon);

  if (!products.length) return null;

  const discount = (p) => Math.round((1 - p.price / p.original_price) * 100);

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Cupom ${code} copiado!`, { description: "Cole no checkout da Shopee antes de pagar." });
  };

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
        {heroDrop && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            data-testid="hero-drop-card"
            className="md:col-span-8 relative rounded-3xl overflow-hidden border border-white/10 bg-[#12141A] group">
            <div className="grid sm:grid-cols-2 h-full">
              <div className="relative min-h-[260px]">
                <img src={heroDrop.image_url} alt={heroDrop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <span className="absolute top-4 left-4 rounded-full bg-[#FF6B00] text-white text-xs font-bold px-3 py-1.5 shadow-[0_0_20px_rgba(255,107,0,0.5)]">
                  -{discount(heroDrop)}% OFF
                </span>
              </div>
              <div className="p-7 sm:p-9 flex flex-col justify-center">
                <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-3">drop principal</p>
                <h3 className="font-display font-bold text-xl sm:text-2xl leading-snug mb-4">{heroDrop.name}</h3>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-display font-extrabold text-3xl text-[#FFB800]">{brl(heroDrop.price)}</span>
                  <span className="text-sm text-zinc-500 line-through">{brl(heroDrop.original_price)}</span>
                </div>
                {heroDrop.mascot_quote && (
                  <div className="flex items-start gap-2.5 mt-3 mb-6 rounded-xl bg-white/5 border border-white/10 p-3.5">
                    <Cat className="w-4 h-4 text-[#FFB800] mt-0.5 shrink-0" />
                    <p className="text-xs text-zinc-300 italic leading-relaxed">"{heroDrop.mascot_quote}"</p>
                  </div>
                )}
                <a href={heroDrop.affiliate_link} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(heroDrop.id)} data-testid="hero-drop-shopee-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm px-6 py-3 transition-colors w-fit">
                  Ver na Shopee <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {topPick && (
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            data-testid="top-pick-card"
            className="md:col-span-4 rounded-3xl overflow-hidden border border-white/10 bg-[#12141A] flex flex-col group">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img src={topPick.image_url} alt={topPick.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <span className="absolute top-4 left-4 rounded-full bg-[#10B981] text-white text-xs font-bold px-3 py-1.5">-{discount(topPick)}%</span>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-2">escolha do gato</p>
              <h3 className="font-display font-bold text-lg leading-snug mb-3 flex-1">{topPick.name}</h3>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="font-display font-extrabold text-2xl text-[#FFB800]">{brl(topPick.price)}</span>
                <span className="text-xs text-zinc-500 line-through">{brl(topPick.original_price)}</span>
              </div>
              <a href={topPick.affiliate_link} target="_blank" rel="noopener noreferrer" onClick={() => trackClick(topPick.id)} data-testid="top-pick-shopee-btn"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FF6B00]/50 text-[#FF6B00] hover:bg-[#FF6B00] hover:text-[#0B0C10] font-bold text-sm px-6 py-3 transition-colors">
                Ver na Shopee <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
          data-testid="coupon-card"
          className="md:col-span-4 rounded-3xl border border-[#FFB800]/25 bg-gradient-to-br from-[#FFB800]/10 via-[#12141A] to-[#12141A] p-7 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#FFB800]/10 blur-2xl" />
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="w-5 h-5 text-[#FFB800]" />
              <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800]">cupom relâmpago</p>
            </div>
            <p className="font-display font-extrabold text-4xl text-white tracking-tight mb-2">
              {couponProduct ? couponProduct.coupon : "GATO10"}
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Copie e cole no checkout da Shopee{couponProduct ? ` para economizar no ${couponProduct.name}` : " nos achadinhos selecionados"}.
            </p>
          </div>
          <button onClick={() => copyCoupon(couponProduct ? couponProduct.coupon : "GATO10")} data-testid="copy-coupon-btn"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#FFB800] hover:bg-white text-[#0B0C10] font-bold text-sm px-6 py-3 transition-colors">
            <Copy className="w-4 h-4" /> Copiar cupom
          </button>
        </motion.div>
      </div>
    </section>
  );
};

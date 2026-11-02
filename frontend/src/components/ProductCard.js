import { motion } from "framer-motion";
import { ExternalLink, Share2, Cat } from "lucide-react";
import { toast } from "sonner";

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const ProductCard = ({ product, index }) => {
  const discount = Math.round((1 - product.price / product.original_price) * 100);

  const share = () => {
    navigator.clipboard.writeText(product.affiliate_link);
    toast.success("Link copiado!", { description: "Mande para quem também ama um achadinho." });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07 }}
      data-testid={`product-card-${product.id}`}
      className="group rounded-2xl overflow-hidden bg-[#12141A] border border-white/10 hover:border-[#FFB800]/40 hover:shadow-[0_0_35px_rgba(255,107,0,0.12)] transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-900">
        <img src={product.image_url} alt={product.name} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <span className="absolute top-3 left-3 rounded-full bg-[#FF6B00] text-white text-xs font-bold px-2.5 py-1 shadow-[0_0_15px_rgba(255,107,0,0.5)]">
          -{discount}%
        </span>
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full backdrop-blur-md bg-[#0B0C10]/70 border border-[#FFB800]/30 text-[#FFB800] text-[10px] font-jetbrains uppercase tracking-wider px-2.5 py-1">
          <Cat className="w-3 h-3" /> aprovado
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-jetbrains uppercase tracking-[0.2em] text-zinc-500 mb-1.5">{product.category}</p>
        <h3 className="font-display font-bold text-base leading-snug mb-3 flex-1">{product.name}</h3>
        {product.mascot_quote && (
          <p className="text-xs text-zinc-500 italic mb-3 leading-relaxed">"{product.mascot_quote}"</p>
        )}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-display font-extrabold text-xl text-[#FFB800]">{brl(product.price)}</span>
          <span className="text-xs text-zinc-500 line-through">{brl(product.original_price)}</span>
        </div>
        <div className="flex gap-2">
          <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer"
            data-testid={`shopee-affiliate-btn-${product.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-xs sm:text-sm px-4 py-2.5 transition-colors">
            Ver na Shopee <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button onClick={share} data-testid={`share-btn-${product.id}`} aria-label="Copiar link"
            className="inline-flex items-center justify-center rounded-full border border-white/15 hover:border-[#FFB800]/50 text-zinc-300 hover:text-[#FFB800] px-3.5 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

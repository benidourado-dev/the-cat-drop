import { motion } from "framer-motion";
import { ArrowDown, Sparkles, Truck, Star, Percent } from "lucide-react";

const HERO_CAT = "https://images.unsplash.com/photo-1789332054301-ead7b9dada1f?crop=entropy&cs=srgb&fm=jpg&q=85";

const lineAnim = (delay) => ({
  initial: { y: "110%" },
  animate: { y: 0 },
  transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
});

export const Hero = () => {
  return (
    <section id="top" data-testid="hero-section" className="relative noise-dots overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#FF6B00]/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-[#FFB800]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB800]" />
            <span className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800]">Achadinhos Shopee do Dia</span>
          </motion.div>

          <h1 data-testid="hero-headline" className="font-display font-extrabold tracking-tight leading-[1.05] text-[clamp(1.75rem,4.6vw,3.4rem)]">
            <span className="block overflow-hidden"><motion.span className="block" {...lineAnim(0.1)}>O GATO</motion.span></span>
            <span className="block overflow-hidden"><motion.span className="block text-[#FF6B00]" {...lineAnim(0.25)}>DROPOU.</motion.span></span>
            <span className="block overflow-hidden"><motion.span className="block" {...lineAnim(0.4)}>VOCÊ <span className="text-[#FFB800]">ECONOMIZOU.</span></motion.span></span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-6 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-md">
            O Gato Preto garimpa as sombras da Shopee e traz só os achadinhos com desconto real,
            vendedor 4.8+ e frete que vale a pena. Sem enrolação, sem preço inflado.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#drops" data-testid="hero-cta-drops"
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm px-7 py-3.5 shadow-[0_0_30px_rgba(255,107,0,0.35)] hover:shadow-[0_0_40px_rgba(255,184,0,0.5)] transition-all">
              Ver drops de hoje <ArrowDown className="w-4 h-4" />
            </a>
            <a href="#o-gato" data-testid="hero-cta-mascot"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 hover:border-[#FFB800]/50 text-zinc-200 font-semibold text-sm px-7 py-3.5 transition-colors">
              Quem é o Gato?
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-12 flex flex-wrap gap-8">
            {[
              { icon: Percent, top: "até 70% OFF", bottom: "descontos reais" },
              { icon: Star, top: "4.8+ avaliação", bottom: "só lojas confiáveis" },
              { icon: Truck, top: "frete grátis", bottom: "em itens selecionados" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <s.icon className="w-5 h-5 text-[#FFB800]" />
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{s.top}</p>
                  <p className="text-xs text-zinc-500">{s.bottom}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.3 }}
          className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 bg-[#FFB800]/15 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(255,107,0,0.15)]">
            <img src={HERO_CAT} alt="O Gato Preto, mascote do The Cat Drop" data-testid="hero-mascot-image"
              className="w-full aspect-[4/5] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10] via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-jetbrains uppercase tracking-[0.25em] text-[#FFB800]">The Dropkeeper</p>
                <p className="font-display font-extrabold text-2xl text-white">O Gato Preto</p>
              </div>
              <div className="animate-float-slow rounded-2xl backdrop-blur-xl bg-[#12141A]/80 border border-[#FFB800]/30 px-4 py-3 text-center">
                <p className="text-xs font-jetbrains uppercase tracking-widest text-zinc-400">drop do dia</p>
                <p className="font-display font-extrabold text-xl text-[#FF6B00]">-58%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, Truck } from "lucide-react";

const MASCOT_IMG = "https://images.unsplash.com/photo-1594820217725-a5fc8385b1ef?crop=entropy&cs=srgb&fm=jpg&q=85";

const BULLETS = [
  { icon: BadgeCheck, text: "Apenas vendedores bem avaliados (4.8+)" },
  { icon: ExternalLink, text: "Link direto para a loja oficial no app da Shopee" },
  { icon: Truck, text: "Atalhos para cupons de frete grátis e moedas Shopee" },
];

export const MascotSection = () => {
  return (
    <section id="o-gato" data-testid="mascot-section" className="relative noise-dots border-t border-white/5 py-20 sm:py-28 overflow-hidden">
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#FF6B00]/8 blur-[140px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative mx-auto w-full max-w-md order-2 lg:order-1">
          <div className="absolute inset-0 bg-[#FFB800]/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="relative rounded-3xl overflow-hidden border border-white/10">
            <img src={MASCOT_IMG} alt="O Gato Preto nas sombras" className="w-full aspect-[4/5] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C10]/90 via-transparent to-transparent" />
            <p className="absolute bottom-5 left-5 right-5 text-xs font-jetbrains uppercase tracking-[0.25em] text-[#FFB800]">
              "quem paga preço cheio é porque não tem um gato."
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="order-1 lg:order-2">
          <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-3">o personagem</p>
          <h2 className="font-display font-bold tracking-tight text-2xl sm:text-3xl lg:text-4xl mb-6">Quem é o Gato do Drop?</h2>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-400 mb-8 max-w-lg">
            Enquanto todo mundo paga preço cheio, o Gato da Shopee percorre as sombras dos cupons
            e ofertas relâmpago para trazer apenas os verdadeiros achadinhos: maior desconto,
            avaliação máxima e frete que compensa. Ele caça, você economiza.
          </p>
          <ul className="space-y-4">
            {BULLETS.map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                <b.icon className="w-5 h-5 text-[#FFB800] shrink-0" />
                <span className="text-sm text-zinc-200">{b.text}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
};

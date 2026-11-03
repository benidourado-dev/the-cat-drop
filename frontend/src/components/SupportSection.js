import { motion } from "framer-motion";
import { Cat, Heart, Coffee, Crown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

const TIPS = [
  { lookup_key: "tip_miau", icon: Coffee, label: "R$ 5", name: "Miau", desc: "Paga o cafezinho do Gato enquanto ele garimpa ofertas." },
  { lookup_key: "tip_ronron", icon: Heart, label: "R$ 10", name: "Ronron", desc: "Ajuda a manter o site no ar e os drops fresquinhos.", featured: true },
  { lookup_key: "tip_drop_vip", icon: Crown, label: "R$ 20", name: "Drop VIP", desc: "Apoio máster — o Gato te manda os achadinhos em primeira mão." },
];

export const SupportSection = () => {
  const pay = async (lookupKey) => {
    try {
      const { data } = await api.post("/payments/checkout", {
        lookup_key: lookupKey,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error("Não consegui abrir o pagamento", { description: "Tente de novo em alguns segundos." });
    }
  };

  return (
    <section id="apoie" data-testid="support-section" className="border-t border-white/5 bg-[#0B0C10] py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#FFB800]/5 blur-[140px] pointer-events-none" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-4 py-1.5 mb-6">
            <Cat className="w-3.5 h-3.5 text-[#FFB800]" />
            <span className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800]">apoie o gato</span>
          </div>
          <h2 className="font-display font-bold tracking-tight text-2xl sm:text-3xl lg:text-4xl mb-4">Gostou dos achadinhos?</h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto mb-12">
            O The Cat Drop é gratuito e vive das comissões da Shopee. Se o Gato já te fez economizar,
            deixe uma contribuição — pagamento seguro via cartão, processado pelo Stripe.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {TIPS.map((t, i) => (
            <motion.div key={t.lookup_key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
              data-testid={`tip-card-${t.lookup_key}`}
              className={`rounded-3xl border p-7 flex flex-col items-center text-center transition-colors ${
                t.featured
                  ? "border-[#FFB800]/40 bg-gradient-to-b from-[#FFB800]/10 to-[#12141A] shadow-[0_0_35px_rgba(255,184,0,0.08)]"
                  : "border-white/10 bg-[#12141A] hover:border-[#FFB800]/30"
              }`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${t.featured ? "bg-[#FFB800] text-[#0B0C10]" : "bg-white/5 text-[#FFB800]"}`}>
                <t.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-zinc-500 mb-1">{t.name}</p>
              <p className="font-display font-extrabold text-3xl text-[#FFB800] mb-3">{t.label}</p>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 flex-1">{t.desc}</p>
              <button onClick={() => pay(t.lookup_key)} data-testid={`tip-pay-btn-${t.lookup_key}`}
                className={`w-full rounded-full font-bold text-sm px-6 py-3 transition-colors ${
                  t.featured
                    ? "bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10]"
                    : "border border-[#FF6B00]/50 text-[#FF6B00] hover:bg-[#FF6B00] hover:text-[#0B0C10]"
                }`}>
                Contribuir {t.label}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="flex items-center justify-center gap-2 text-[11px] text-zinc-600">
          <ShieldCheck className="w-3.5 h-3.5" /> Pagamento processado com segurança pelo Stripe. Nenhum dado do seu cartão passa pelo nosso site.
        </p>
      </div>
    </section>
  );
};

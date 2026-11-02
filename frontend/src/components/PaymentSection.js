import { motion } from "framer-motion";
import { QrCode, CreditCard, Barcode, ShieldCheck, Copy, Wallet, BadgePercent, Truck } from "lucide-react";
import { toast } from "sonner";

const PIX_KEY = "152074587790";

const METHODS = [
  {
    icon: QrCode,
    title: "Pix",
    highlight: true,
    desc: "A forma mais rápida. Aprovação na hora e descontos exclusivos em muitas lojas.",
    steps: ["Copie a chave Pix abaixo ou escaneie o QR no checkout", "Cole no app do seu banco", "Confirme e pronto: pedido aprovado na hora"],
  },
  {
    icon: CreditCard,
    title: "Cartão de Débito",
    desc: "Débito direto na conta, sem fatura no fim do mês.",
    steps: ["Selecione 'Cartão de débito' no checkout da Shopee", "Cadastre ou escolha seu cartão", "Aprovação rápida, direto na conta"],
  },
  {
    icon: Wallet,
    title: "Cartão de Crédito",
    desc: "Parcele em até 12x nas lojas participantes. Ideal para compras maiores.",
    steps: ["Escolha 'Cartão de crédito' no checkout", "Selecione o número de parcelas", "Verifique se há juros antes de confirmar"],
  },
  {
    icon: Barcode,
    title: "Boleto & ShopeePay",
    desc: "Boleto bancário ou saldo ShopeePay com cupons de cashback.",
    steps: ["Boleto: pague em qualquer banco ou lotérica", "ShopeePay: recarregue e ganhe cashback", "Moedas Shopee abatem parte do valor"],
  },
];

export const PaymentSection = () => {
  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast.success("Chave Pix copiada!", { description: "Use no checkout ou para falar com a gente." });
  };

  return (
    <section id="pagamento" data-testid="payment-section" className="border-t border-white/5 bg-[#0B0C10] py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-[#10B981]/5 blur-[140px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14">
          <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-3">pague do seu jeito</p>
          <h2 className="font-display font-bold tracking-tight text-2xl sm:text-3xl lg:text-4xl mb-4">Formas de Pagamento</h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Todas as compras são finalizadas com segurança dentro da Shopee. O Gato só te leva até a oferta — o pagamento e a entrega são 100% garantidos pela plataforma.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {METHODS.map((m, i) => (
            <motion.div key={m.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
              data-testid={`payment-method-${m.title.toLowerCase().replace(/[^a-z]/g, '-')}`}
              className={`rounded-3xl border p-6 flex flex-col ${
                m.highlight
                  ? "border-[#10B981]/40 bg-gradient-to-b from-[#10B981]/10 to-[#12141A]"
                  : "border-white/10 bg-[#12141A]"
              }`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${
                m.highlight ? "bg-[#10B981] text-[#0B0C10]" : "bg-white/5 text-[#FFB800]"
              }`}>
                <m.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
                {m.title}
                {m.highlight && <span className="text-[10px] font-jetbrains uppercase tracking-wider bg-[#10B981]/20 text-[#10B981] rounded-full px-2 py-0.5">recomendado</span>}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{m.desc}</p>
              <ol className="space-y-2 mt-auto">
                {m.steps.map((s, j) => (
                  <li key={j} className="flex items-start gap-2 text-[11px] text-zinc-500 leading-relaxed">
                    <span className="text-[#FFB800] font-jetbrains font-bold shrink-0">{j + 1}.</span> {s}
                  </li>
                ))}
              </ol>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          data-testid="pix-highlight-card"
          className="rounded-3xl border border-[#10B981]/30 bg-gradient-to-r from-[#10B981]/10 via-[#12141A] to-[#12141A] p-7 sm:p-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-6 h-6 text-[#10B981]" />
              <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#10B981]">pix direto com o gato</p>
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl mb-3">Nossa chave Pix oficial</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              Para suporte, parcerias ou pedidos especiais, use a chave Pix oficial do The Cat Drop. Guarde com carinho — o Gato agradece.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <code data-testid="pix-key-display" className="font-jetbrains text-sm sm:text-base font-bold text-white bg-[#0B0C10] border border-white/15 rounded-xl px-5 py-3 tracking-wider">
                {PIX_KEY}
              </code>
              <button onClick={copyPix} data-testid="copy-pix-btn"
                className="inline-flex items-center gap-2 rounded-full bg-[#10B981] hover:bg-white text-[#0B0C10] font-bold text-sm px-5 py-3 transition-colors">
                <Copy className="w-4 h-4" /> Copiar Pix
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, label: "Compra protegida", sub: "Garantia Shopee em todos os pedidos" },
              { icon: BadgePercent, label: "Cupons ativos", sub: "Desconto extra no checkout" },
              { icon: Truck, label: "Frete grátis", sub: "Em itens selecionados pelo Gato" },
              { icon: QrCode, label: "Aprovação imediata", sub: "Pix cai na hora, sem espera" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl bg-[#0B0C10]/60 border border-white/10 p-4">
                <f.icon className="w-5 h-5 text-[#FFB800] mb-2" />
                <p className="text-xs font-bold text-white">{f.label}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

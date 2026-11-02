import { useState } from "react";
import { Link } from "react-router-dom";
import { Cat, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Footer = () => {
  const [contact, setContact] = useState("");

  const subscribe = (e) => {
    e.preventDefault();
    if (!contact.trim()) return;
    toast.success("Você entrou na lista do Gato!", { description: "Os próximos drops chegam primeiro pra você." });
    setContact("");
  };

  return (
    <footer data-testid="site-footer" className="border-t border-white/10 bg-[#0B0C10]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center">
                <Cat className="w-5 h-5 text-[#0B0C10]" strokeWidth={2.5} />
              </span>
              <span className="font-display font-extrabold text-lg tracking-tight">
                THE CAT <span className="text-[#FFB800]">DROP</span>
              </span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              Curadoria de achadinhos da Shopee feita pelo Gato Preto. Desconto real, loja confiável e zero enrolação.
            </p>
            <p className="text-xs text-zinc-600 leading-relaxed mt-5 max-w-xs">
              Aviso: como afiliados, podemos receber comissão pelas compras feitas pelos links desta página, sem custo extra para você.
            </p>
          </div>

          <div>
            <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-5">atalhos do gato</p>
            <ul className="space-y-3">
              <li><a href="#drops" data-testid="footer-link-drops" className="text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">Ofertas do Dia</a></li>
              <li><a href="#catalogo" data-testid="footer-link-catalogo" className="text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">Catálogo completo</a></li>
              <li><a href="#o-gato" data-testid="footer-link-o-gato" className="text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">Quem é o Gato</a></li>
              <li>
                <Link to="/admin" data-testid="footer-admin-link" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" /> Área do lojista
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-5">alerta de drop</p>
            <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
              Deixe seu contato e receba os achadinhos antes de todo mundo.
            </p>
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Seu WhatsApp ou e-mail"
                data-testid="newsletter-input"
                className="flex-1 rounded-full bg-[#12141A] border border-white/10 focus:border-[#FFB800]/50 focus:outline-none px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors"
              />
              <button type="submit" data-testid="newsletter-submit-btn" aria-label="Inscrever"
                className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] px-4 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/5 mt-14 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">© 2026 The Cat Drop. Todos os direitos reservados.</p>
          <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-zinc-600">caçado pelo gato preto</p>
        </div>
      </div>
    </footer>
  );
};

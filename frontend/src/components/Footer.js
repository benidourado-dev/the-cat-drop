import { Link } from "react-router-dom";
import { Cat, ShieldCheck, Mail, Phone } from "lucide-react";

const EMAIL = "benidourado@gmail.com";
const WHATSAPP = "https://wa.me/55973054829";

export const Footer = () => {
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
              <li><a href="#pagamento" data-testid="footer-link-pagamento" className="text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">Formas de pagamento</a></li>
              <li><a href="#o-gato" data-testid="footer-link-o-gato" className="text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">Quem é o Gato</a></li>
              <li>
                <Link to="/admin" data-testid="footer-admin-link" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-[#FFB800] transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" /> Área do lojista
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-jetbrains uppercase tracking-[0.2em] text-[#FFB800] mb-5">fale com o gato</p>
            <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
              Dúvidas sobre um achadinho, parceria ou sugestão de produto? Chama a gente.
            </p>
            <div className="space-y-3">
              <a href={`mailto:${EMAIL}`} data-testid="footer-email-link"
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FFB800]/40 px-4 py-3 transition-colors group">
                <span className="w-9 h-9 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#FF6B00]" />
                </span>
                <span>
                  <span className="block text-[10px] font-jetbrains uppercase tracking-widest text-zinc-500">e-mail</span>
                  <span className="block text-sm text-zinc-200 group-hover:text-[#FFB800] transition-colors">{EMAIL}</span>
                </span>
              </a>
              <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp-link"
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#10B981]/40 px-4 py-3 transition-colors group">
                <span className="w-9 h-9 rounded-xl bg-[#10B981]/15 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#10B981]" />
                </span>
                <span>
                  <span className="block text-[10px] font-jetbrains uppercase tracking-widest text-zinc-500">whatsapp</span>
                  <span className="block text-sm text-zinc-200 group-hover:text-[#10B981] transition-colors">(97) 3054-829</span>
                </span>
              </a>
            </div>
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

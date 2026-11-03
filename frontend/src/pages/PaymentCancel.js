import { Link } from "react-router-dom";
import { Cat, XCircle } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-[#0B0C10] noise-dots flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-[#12141A] border border-white/10 p-10 text-center" data-testid="payment-cancel-page">
        <span className="w-14 h-14 rounded-2xl bg-[#FF6B00] flex items-center justify-center mx-auto mb-6">
          <Cat className="w-7 h-7 text-[#0B0C10]" strokeWidth={2.5} />
        </span>
        <XCircle className="w-10 h-10 text-zinc-500 mx-auto mb-4" />
        <h1 className="font-display font-extrabold text-2xl mb-3">Pagamento cancelado</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          Sem problema! O Gato não guarda rancor. Os achadinhos continuam gratuitos pra você.
        </p>
        <Link to="/" data-testid="cancel-back-home-btn"
          className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm px-7 py-3 transition-colors">
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
}

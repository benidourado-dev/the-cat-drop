import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Cat, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [paid, setPaid] = useState(false);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    const poll = setInterval(async () => {
      attempts.current += 1;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        if (data.payment_status === "paid") {
          setPaid(true);
          clearInterval(poll);
        }
      } catch { /* keep polling */ }
      if (attempts.current >= 15) clearInterval(poll);
    }, 2000);
    return () => clearInterval(poll);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#0B0C10] noise-dots flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-[#12141A] border border-white/10 p-10 text-center" data-testid="payment-success-page">
        <span className="w-14 h-14 rounded-2xl bg-[#FF6B00] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(255,107,0,0.4)]">
          <Cat className="w-7 h-7 text-[#0B0C10]" strokeWidth={2.5} />
        </span>
        {paid ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto mb-4" />
            <h1 className="font-display font-extrabold text-2xl mb-3" data-testid="payment-confirmed-title">Pagamento confirmado!</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
              Muito obrigado por apoiar o Gato! Sua contribuição ajuda a manter os drops fresquinhos toda semana.
            </p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="font-display font-extrabold text-2xl mb-3">Confirmando pagamento...</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">Só um instante, estamos conferindo com o Stripe.</p>
          </>
        )}
        <Link to="/" data-testid="back-home-btn"
          className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] hover:bg-[#FFB800] text-[#0B0C10] font-bold text-sm px-7 py-3 transition-colors">
          Voltar para a loja
        </Link>
      </div>
    </div>
  );
}

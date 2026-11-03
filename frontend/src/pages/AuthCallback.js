import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function AuthCallback() {
  const hasProcessed = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const sessionId = new URLSearchParams(location.hash.replace("#", "")).get("session_id");
    if (!sessionId) {
      navigate("/admin", { replace: true });
      return;
    }

    api.post("/auth/google", { session_id: sessionId })
      .then((res) => {
        navigate("/admin", { replace: true, state: { user: res.data } });
      })
      .catch(() => {
        navigate("/admin", { replace: true });
      });
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
      <div className="text-center" data-testid="auth-callback-loading">
        <div className="w-10 h-10 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-zinc-400">Entrando com o Google...</p>
      </div>
    </div>
  );
}

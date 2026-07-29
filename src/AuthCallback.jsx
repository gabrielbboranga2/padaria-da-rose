import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("PKCE exchange failed:", exchangeError);
            setError("Erro ao completar login. Tente novamente.");
            return;
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setError("Sessão não encontrada. Tente novamente.");
            return;
          }
        }

        window.history.replaceState({}, document.title, "/");
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("Erro inesperado ao processar login.");
      }
    };

    handleAuth();
  }, [navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#FFF8F0", fontFamily: "'Inter', sans-serif", padding: 24, textAlign: "center"
      }}>
        <div>
          <p style={{ fontSize: "2rem", marginBottom: 12 }}>❌</p>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1C0A00", marginBottom: 8 }}>Erro no Login</h2>
          <p style={{ fontSize: "0.92rem", color: "#7A6B5D", marginBottom: 20, maxWidth: 400 }}>{error}</p>
          <button onClick={() => navigate("/")} style={{
            padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFF",
            fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 6px 20px rgba(245,158,11,0.3)"
          }}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#FFF8F0", fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, border: "3px solid #F59E0B", borderTopColor: "transparent",
          borderRadius: "50%", animation: "authSpin 1s linear infinite", margin: "0 auto 16px"
        }} />
        <p style={{ color: "#7A6B5D", fontSize: "0.95rem", fontWeight: 500 }}>Finalizando login...</p>
        <style>{`@keyframes authSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

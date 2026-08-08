import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock, LogOut, Package, ShoppingBag, Users, Plus, Trash2, Printer,
  Copy, Check, Wheat, ChevronDown, Bell, TrendingUp, Clock, AlertCircle,
  RefreshCw, Edit3, ToggleLeft, ToggleRight, Link2, Search, Zap, Coffee,
  Star, Activity, ArrowUpRight, BarChart2, Sparkles, MessageCircle, Send
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

const STATUS_CONFIG = {
  novo:       { label: "Novo",       bg: "rgba(99,102,241,0.12)",  color: "#818CF8", dot: "#6366F1",  glow: "rgba(99,102,241,0.4)"  },
  preparando: { label: "Preparando", bg: "rgba(251,146,60,0.12)",  color: "#FB923C", dot: "#F97316",  glow: "rgba(249,115,22,0.4)"  },
  pronto:     { label: "Pronto",     bg: "rgba(52,211,153,0.12)",  color: "#34D399", dot: "#10B981",  glow: "rgba(16,185,129,0.4)"  },
  entregue:   { label: "Entregue",   bg: "rgba(148,163,184,0.12)", color: "#94A3B8", dot: "#64748B",  glow: "rgba(100,116,139,0.3)" },
  cancelado:  { label: "Cancelado",  bg: "rgba(248,113,113,0.12)", color: "#F87171", dot: "#EF4444",  glow: "rgba(239,68,68,0.4)"   },
};

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #080B14;
    color: #E2E8F0;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .font-display { font-family: 'Syne', sans-serif; }
  .font-mono    { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse    { 0%,100% { opacity:.5; } 50% { opacity:1; } }
  @keyframes glow     { 0%,100% { box-shadow: 0 0 16px var(--glow,#6366F1); } 50% { box-shadow: 0 0 32px var(--glow,#6366F1); } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes slideIn  { from { transform:translateX(-12px); opacity:0; } to { transform:none; opacity:1; } }
  @keyframes popIn    { 0% { transform:scale(.85); opacity:0; } 70% { transform:scale(1.04); } 100% { transform:scale(1); opacity:1; } }
  @keyframes shimmer  { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes neonPulse{ 0%,100%{text-shadow:0 0 6px #E8C36A,0 0 20px rgba(232,195,106,.4);} 50%{text-shadow:0 0 12px #E8C36A,0 0 40px rgba(232,195,106,.6);} }
  @keyframes borderGlow{ 0%,100%{border-color:rgba(232,195,106,.25);} 50%{border-color:rgba(232,195,106,.55);} }
  @keyframes newOrder { 0%{transform:scale(1);} 25%{transform:scale(1.015);} 75%{transform:scale(.99);} 100%{transform:scale(1);} }
  @keyframes dotPulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.5);opacity:.7;} }

  .animate-fade-up   { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
  .animate-fade-in   { animation: fadeIn .35s ease both; }
  .animate-pop-in    { animation: popIn .45s cubic-bezier(.22,1,.36,1) both; }
  .animate-new-order { animation: newOrder .6s ease; }
  .dot-pulse         { animation: dotPulse 1.8s ease-in-out infinite; }

  .glass {
    background: rgba(255,255,255,0.035);
    backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.07);
  }

  .glass-card {
    background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    border-radius: 18px;
    transition: all .25s ease;
  }
  .glass-card:hover {
    border-color: rgba(232,195,106,0.22);
    box-shadow: 0 8px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(232,195,106,.08);
    transform: translateY(-2px);
  }

  .tab-btn { transition: all .2s ease; }
  .tab-btn:hover { background: rgba(255,255,255,.06) !important; }

  .btn-primary {
    background: linear-gradient(135deg, #E8C36A 0%, #D4A04A 100%);
    color: #0D0F18;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all .18s ease;
    box-shadow: 0 4px 20px rgba(232,195,106,.3);
  }
  .btn-primary:hover { filter: brightness(1.08); box-shadow: 0 6px 28px rgba(232,195,106,.45); transform: translateY(-1px); }
  .btn-primary:active { transform: scale(.97); }

  .btn-ghost {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
    color: #94A3B8;
    cursor: pointer;
    transition: all .18s ease;
  }
  .btn-ghost:hover { background: rgba(255,255,255,.09); border-color: rgba(255,255,255,.18); color: #E2E8F0; }

  .input-dark {
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 10px;
    color: #E2E8F0;
    font-family: 'Inter', sans-serif;
    transition: all .2s;
    outline: none;
    width: 100%;
  }
  .input-dark::placeholder { color: #475569; }
  .input-dark:focus {
    border-color: rgba(232,195,106,.5);
    box-shadow: 0 0 0 3px rgba(232,195,106,.1);
    background: rgba(255,255,255,.06);
  }

  select.input-dark { appearance: none; }

  .bar-novo       { background: linear-gradient(90deg,#6366F1,#818CF8); }
  .bar-preparando { background: linear-gradient(90deg,#F97316,#FBBF24); }
  .bar-pronto     { background: linear-gradient(90deg,#10B981,#34D399); }
  .bar-entregue   { background: linear-gradient(90deg,#475569,#64748B); }
  .bar-cancelado  { background: linear-gradient(90deg,#EF4444,#F87171); }

  ::-webkit-scrollbar { width:5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius:3px; }

  @media (max-width: 640px) {
    .attendant-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }

  @media print {
    @page { size: 80mm auto; margin: 0; }
    body * { visibility: hidden !important; }
    .comanda-print, .comanda-print * { visibility: visible !important; }
    .comanda-print {
      position: fixed; top: 0; left: 0;
      width: 80mm; font-family: monospace;
      font-size: 16px; line-height: 1.5;
      color: #000; background: #fff;
      padding: 2mm; margin: 0; display: block !important;
    }
    .comanda-print p { margin: 4px 0; white-space: pre-wrap; }
    .comanda-print .divider { border-top: 1px dashed #000; margin: 10px 0; }
  }
`;

const DEFAULT_ATTENDANTS = [
  { id: "gabriel",   name: "Gabriel",        color: "#6366F1", emoji: "👨‍💼" },
  { id: "rose",      name: "Rose",           color: "#EC4899", emoji: "👩‍🍳" },
  { id: "ariane",    name: "Ariane",         color: "#8B5CF6", emoji: "💁‍♀️" },
  { id: "felipe",    name: "Felipe",         color: "#F97316", emoji: "🧑‍💼" },
  { id: "marcos",    name: "Marcos",         color: "#10B981", emoji: "👨‍🔧" },
  { id: "padaria",   name: "Padaria da Rose", color: "#E8C36A", emoji: "🏪" },
];

const ATTENDANT_COLORS = [
  "#6366F1", "#EC4899", "#8B5CF6", "#F97316", "#10B981", "#E8C36A",
  "#EF4444", "#06B6D4", "#84CC16", "#F43F5E", "#14B8A6", "#A855F7",
];

const ATTENDANT_EMOJIS = [
  "👨‍💼", "👩‍🍳", "💁‍♀️", "🧑‍💼", "👨‍🔧", "🏪",
  "👨‍🏫", "👩‍💻", "🧑‍🎤", "👨‍🚀", "👩‍⚕️", "🧑‍🍳",
  "😎", "🤩", "💪", "🙋", "👨", "👩",
];

function getAttendants() {
  try {
    const saved = localStorage.getItem("padaria_team");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEFAULT_ATTENDANTS];
}

function saveAttendants(list) {
  try { localStorage.setItem("padaria_team", JSON.stringify(list)); } catch {}
}

function getSavedAttendant() {
  try {
    const id = localStorage.getItem("padaria_attendant");
    if (id && typeof id === "string") return id;
  } catch {}
  return null;
}

function TelaSelecaoAtendente({ onSelect }) {
  const [team, setTeam] = useState(getAttendants);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, background: "#080B14", position: "relative", overflow: "hidden"
    }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,195,106,.08) 0%, transparent 70%)" }} />
      </div>

      <div className="animate-fade-up" style={{ position: "relative", zIndex: 1, textAlign: "center", width: "100%", maxWidth: 520 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
          margin: "0 auto 20px",
          boxShadow: "0 0 0 2px rgba(232,195,106,0.3), 0 0 40px rgba(232,195,106,0.15), 0 16px 40px rgba(0,0,0,.6)"
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <h2 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 700, color: "#FFF8F0", marginBottom: 6 }}>
          Quem está usando?
        </h2>
        <p style={{ fontSize: "0.88rem", color: "#475569", marginBottom: 36 }}>
          Selecione seu nome para continuar
        </p>

        {team.length === 0 ? (
          <div style={{ padding: 40 }}>
            <p style={{ color: "#475569", fontSize: "0.92rem" }}>Nenhum membro cadastrado.</p>
            <p style={{ color: "#334155", fontSize: "0.82rem", marginTop: 8 }}>Faça login e adicione na aba Equipe.</p>
          </div>
        ) : (
          <div className="attendant-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {team.map((att, i) => (
              <button key={att.id} onClick={() => onSelect(att)} className="animate-fade-up"
                style={{
                  background: "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                  border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "28px 16px",
                  cursor: "pointer", transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  animationDelay: `${i * 0.06}s`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = att.color;
                  e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                  e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 20px ${att.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
                }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${att.color}33, ${att.color}15)`,
                  border: `2px solid ${att.color}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px", fontSize: "1.6rem"
                }}>
                  {att.emoji}
                </div>
                <p style={{ fontWeight: 700, color: "#E2E8F0", fontSize: "0.92rem" }}>{att.name}</p>
              </button>
            ))}
          </div>
        )}

        <button onClick={() => supabase.auth.signOut()} className="btn-ghost" style={{
          marginTop: 32, padding: "10px 24px", borderRadius: 100, fontSize: "0.82rem",
          display: "inline-flex", alignItems: "center", gap: 7
        }}>
          <LogOut size={13} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

export default function PainelAdmin() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("pedidos");
  const [attendant, setAttendant] = useState(() => {
    const saved = getSavedAttendant();
    if (!saved) return null;
    const team = getAttendants();
    return team.find(a => a.id === saved) || null;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSelectAttendant = (att) => {
    localStorage.setItem("padaria_attendant", att.id);
    setAttendant(att);
  };

  const handleChangeAttendant = () => {
    localStorage.removeItem("padaria_attendant");
    setAttendant(null);
  };

  if (!session) return <TelaLogin />;
  if (!attendant) return <TelaSelecaoAtendente onSelect={handleSelectAttendant} />;

  const TABS = [
    { id: "pedidos",      label: "Pedidos",      icon: ShoppingBag },
    { id: "produtos",     label: "Produtos",     icon: Package     },
    { id: "equipe",       label: "Equipe",       icon: Users       },
    { id: "chat",         label: "Chat",         icon: MessageCircle },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#080B14" }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%",  width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,195,106,0.05) 0%, transparent 70%)" }} />
      </div>

      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,11,20,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%", overflow: "hidden",
              boxShadow: "0 0 0 2px rgba(232,195,106,0.3), 0 4px 16px rgba(0,0,0,0.5)"
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#FFF8F0", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                Padaria <span style={{ color: "#E8C36A", animation: "neonPulse 3s ease-in-out infinite" }}>da Rose</span>
              </h1>
              <p style={{ fontSize: "0.68rem", color: "#475569", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>Painel Admin</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleChangeAttendant} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 14px 6px 8px", borderRadius: 100,
              background: `${attendant.color}18`, border: `1px solid ${attendant.color}44`,
              color: attendant.color, fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s"
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: "50%",
                background: `${attendant.color}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.85rem"
              }}>{attendant.emoji}</span>
              {attendant.name}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="dot-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "block" }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#34D399", letterSpacing: "0.04em" }}>ONLINE</span>
            </div>

            <button onClick={() => supabase.auth.signOut()} className="btn-ghost"
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 100, fontSize: "0.82rem", fontWeight: 500 }}>
              <LogOut size={13} /> Sair
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "flex", gap: 2, position: "relative", zIndex: 1, overflowX: "auto" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "12px 18px", fontSize: "0.84rem", fontWeight: active ? 600 : 400,
                  color: active ? "#E8C36A" : "#64748B",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: active ? "2px solid #E8C36A" : "2px solid transparent",
                  marginBottom: -1, borderRadius: "6px 6px 0 0",
                  transition: "all .2s", whiteSpace: "nowrap"
                }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 28px 80px", position: "relative", zIndex: 1 }}>
        {tab === "pedidos"      && <AbaPedidos />}
        {tab === "produtos"     && <AbaProdutos />}
        {tab === "equipe"       && <AbaEquipe />}
        {tab === "chat"         && <AbaChat session={session} attendantName={attendant.name} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════ */
function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha incorretos.");
    setCarregando(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, background: "#080B14", position: "relative", overflow: "hidden"
    }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "15%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "10%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,195,106,.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }} className="animate-fade-up">
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
            margin: "0 auto 18px",
            boxShadow: "0 0 0 1px rgba(232,195,106,0.3), 0 0 40px rgba(232,195,106,0.15), 0 16px 40px rgba(0,0,0,.6)"
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <h2 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 700, color: "#FFF8F0", marginBottom: 6, letterSpacing: "-0.02em" }}>
            Painel da Rose
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#475569" }}>Área restrita — acesso autorizado</p>
        </div>

        <div style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: "32px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.07)",
          backdropFilter: "blur(12px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "10px 14px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <Lock size={14} color="#818CF8" />
            <span style={{ fontSize: "0.76rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#818CF8" }}>Acesso restrito</span>
          </div>

          <form onSubmit={entrar}>
            {[
              { label: "E-mail", key: "email", type: "email", value: email, onChange: setEmail, placeholder: "seu@email.com" },
              { label: "Senha", key: "senha", type: "password", value: senha, onChange: setSenha, placeholder: "••••••••" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", marginBottom: 8 }}>{f.label}</label>
                <input
                  value={f.value} onChange={(e) => f.onChange(e.target.value)}
                  required type={f.type} placeholder={f.placeholder}
                  className="input-dark"
                  style={{ padding: "13px 16px", fontSize: "0.93rem" }}
                />
              </div>
            ))}

            {erro && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", marginBottom: 16 }}>
                <AlertCircle size={14} color="#F87171" />
                <p style={{ fontSize: "0.84rem", color: "#F87171" }}>{erro}</p>
              </div>
            )}

            <button type="submit" disabled={carregando} className="btn-primary"
              style={{ width: "100%", padding: 15, borderRadius: 13, fontSize: "0.95rem", marginTop: 8, opacity: carregando ? .7 : 1 }}>
              {carregando ? "Entrando…" : "Entrar →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABA PEDIDOS
   ═══════════════════════════════════════════════ */
function AbaPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const printRef = useRef(null);
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState(null);
  const [carregandoImpressao, setCarregandoImpressao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [novoPedidoId, setNovoPedidoId] = useState(null);

  const carregarPedidos = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(30);
    setPedidos(data || []);
    setCarregando(false);
  };

  const aguardarItens = async (orderId, tentativas = 0) => {
    if (tentativas >= 10) { setCarregandoImpressao(false); setPedidoParaImprimir(null); return; }
    const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).single();
    if (data && data.order_items && data.order_items.length > 0) {
      setPedidos((prev) => {
        const idx = prev.findIndex((p) => p.id === orderId);
        if (idx >= 0) { const u = [...prev]; u[idx] = data; return u; }
        return [data, ...prev];
      });
      setCarregandoImpressao(false);
      setPedidoParaImprimir(orderId);
    } else {
      setTimeout(() => aguardarItens(orderId, tentativas + 1), 500);
    }
  };

  useEffect(() => {
    carregarPedidos();
    const canal = supabase
      .channel("pedidos-novos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        playBeep();
        setNovoPedidoId(payload.new.id);
        setCarregandoImpressao(true);
        await aguardarItens(payload.new.id);
        setTimeout(() => setNovoPedidoId(null), 5000);
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  useEffect(() => {
    if (pedidoParaImprimir) {
      setTimeout(() => {
        window.print();
        setTimeout(() => setPedidoParaImprimir(null), 1000);
      }, 300);
    }
  }, [pedidoParaImprimir]);

  const mudarStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    carregarPedidos();
  };

  const pedidoImpresso = pedidos.find((p) => p.id === pedidoParaImprimir);

  const novos    = pedidos.filter((p) => p.status === "novo").length;
  const prepando = pedidos.filter((p) => p.status === "preparando").length;
  const totalHoje = pedidos.filter((p) => {
    const d = new Date(p.created_at);
    return d.toDateString() === new Date().toDateString();
  }).reduce((s, p) => s + Number(p.total), 0);

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Pedidos
          </h2>
          <p style={{ fontSize: "0.83rem", color: "#475569" }}>Monitoramento em tempo real</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={async () => {
            if (!window.confirm("Resetar a numeração dos pedidos para #1? Isso apaga TODOS os pedidos anteriores.")) return;
            await supabase.rpc("reset_order_sequence");
            await supabase.from("order_items").delete().neq("id", 0);
            await supabase.from("orders").delete().neq("id", 0);
            carregarPedidos();
          }} className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 100, fontSize: "0.82rem", borderColor: "rgba(239,68,68,0.25)", color: "#F87171" }}>
            <AlertCircle size={13} /> Resetar numeração
          </button>
          <button onClick={carregarPedidos} className="btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 100, fontSize: "0.82rem" }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Novos pedidos",   value: novos,            icon: Bell,       accent: "#6366F1", glow: "rgba(99,102,241,.25)",  sub: "aguardando" },
          { label: "Em preparo",      value: prepando,         icon: Activity,   accent: "#F97316", glow: "rgba(249,115,22,.25)", sub: "na cozinha" },
          { label: "Faturado hoje",   value: money(totalHoje), icon: TrendingUp, accent: "#10B981", glow: "rgba(16,185,129,.25)", sub: "receita do dia", mono: true },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card animate-fade-up" style={{ padding: "22px 24px", animationDelay: `${i * 0.07}s` }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", marginBottom: 10 }}>{s.label}</p>
                  <p style={{ fontSize: s.mono ? "1.25rem" : "2.2rem", fontWeight: 700, color: s.accent, fontFamily: s.mono ? "'JetBrains Mono', monospace" : "'Syne', sans-serif", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: "0.75rem", color: "#334155", marginTop: 6 }}>{s.sub}</p>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `radial-gradient(circle, ${s.glow}, transparent 70%)`,
                  border: `1px solid ${s.accent}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 20px ${s.glow}`
                }}>
                  <Icon size={19} color={s.accent} />
                </div>
              </div>
              <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${s.accent}, transparent)`, opacity: .5 }} />
            </div>
          );
        })}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "13px 18px",
        borderRadius: 14, background: "rgba(232,195,106,0.06)",
        border: "1px solid rgba(232,195,106,0.14)", marginBottom: 24,
        animation: "borderGlow 4s ease-in-out infinite"
      }}>
        <Zap size={14} color="#E8C36A" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: "0.82rem", color: "#94A3B8" }}>
          Mantenha esta aba aberta — cada novo pedido toca um alerta e imprime a comanda automaticamente.
        </p>
      </div>

      {carregando ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Wheat size={32} color="#E8C36A" style={{ margin: "0 auto 12px", display: "block", opacity: .5, animation: "spin 2s linear infinite" }} />
          <p style={{ color: "#475569", fontSize: "0.9rem" }}>Carregando pedidos…</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pedidos.map((p, i) => {
            const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.novo;
            const isNew = p.id === novoPedidoId;
            return (
              <div key={p.id}
                className={isNew ? "animate-new-order" : ""}
                style={{
                  background: isNew
                    ? "linear-gradient(145deg, rgba(99,102,241,0.10), rgba(255,255,255,0.03))"
                    : "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                  border: `1px solid ${isNew ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 18, overflow: "hidden",
                  boxShadow: isNew ? `0 0 24px rgba(99,102,241,0.2), 0 4px 20px rgba(0,0,0,.3)` : "0 2px 12px rgba(0,0,0,.2)",
                  transition: "all .3s ease",
                  animation: isNew ? "borderGlow 1s ease-in-out infinite" : "none"
                }}>
                <div style={{ height: 3 }} className={`bar-${p.status}`} />

                <div style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span className="font-mono" style={{ fontWeight: 700, fontSize: "0.83rem", color: "#94A3B8" }}>#{p.id}</span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 100,
                          background: sc.bg, color: sc.color,
                          fontSize: "0.72rem", fontWeight: 600, border: `1px solid ${sc.dot}33`
                        }}>
                          <span className={p.status === "novo" || p.status === "preparando" ? "dot-pulse" : ""} style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "block" }} />
                          {sc.label}
                        </span>
                        {isNew && (
                          <span style={{ padding: "3px 10px", borderRadius: 100, background: "rgba(99,102,241,0.15)", color: "#818CF8", fontSize: "0.7rem", fontWeight: 700, border: "1px solid rgba(99,102,241,0.3)" }}>
                            ✦ NOVO
                          </span>
                        )}
                      </div>
                      <p style={{ fontWeight: 700, color: "#F1F5F9", fontSize: "1rem", marginBottom: 4 }}>{p.customer_name}</p>
                      <p style={{ fontSize: "0.82rem", color: "#64748B", marginBottom: 2 }}>
                        {p.customer_phone} · Retirada:{" "}
                        {p.pickup_time === "Combinar no chat" ? (
                          <strong style={{ color: "#FBBF24", background: "rgba(251,191,36,0.12)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(251,191,36,0.3)" }}>
                            💬 Combinar no chat
                          </strong>
                        ) : (
                          <strong style={{ color: "#94A3B8" }}>{p.pickup_time}</strong>
                        )}
                      </p>
                      {p.employee_slug && <p style={{ fontSize: "0.74rem", fontFamily: "'JetBrains Mono', monospace", color: "#E8C36A", opacity: .7 }}>via: {p.employee_slug}</p>}
                      {p.notes && <p style={{ fontSize: "0.78rem", color: "#475569", marginTop: 5, fontStyle: "italic" }}>💬 {p.notes}</p>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <p className="font-mono" style={{ fontWeight: 700, fontSize: "1.15rem", color: "#E8C36A" }}>{money(p.total)}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setPedidoParaImprimir(p.id)} className="btn-ghost"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, fontSize: "0.79rem", fontWeight: 500 }}>
                          <Printer size={12} /> Imprimir
                        </button>
                        <div style={{ position: "relative" }}>
                          <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)}
                            className="input-dark"
                            style={{
                              padding: "7px 32px 7px 12px", borderRadius: 9,
                              background: sc.bg, color: sc.color,
                              fontSize: "0.79rem", fontWeight: 600, cursor: "pointer",
                              border: `1px solid ${sc.dot}44`, width: "auto"
                            }}>
                            <option value="novo">Novo</option>
                            <option value="preparando">Preparando</option>
                            <option value="pronto">Pronto</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                          <ChevronDown size={11} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: sc.color }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {p.order_items && p.order_items.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                        {p.order_items.map((it) => (
                          <span key={it.id} style={{
                            padding: "4px 12px", borderRadius: 8,
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                            fontSize: "0.79rem", color: "#94A3B8"
                          }}>
                            <strong style={{ color: "#CBD5E1" }}>{it.qty}×</strong> {it.product_name}
                            {it.observation && <span style={{ color: "#FBBF24", fontStyle: "italic" }}> ({it.observation})</span>}
                            {' '}· <span className="font-mono" style={{ fontSize: "0.74rem", color: "#E8C36A" }}>{money(it.unit_price * it.qty)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {pedidos.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <ShoppingBag size={36} color="#1E293B" style={{ margin: "0 auto 14px", display: "block" }} />
              <p style={{ color: "#334155", fontSize: "0.95rem" }}>Nenhum pedido ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Print area — formatted for TANCA TP-550 (80mm) */}
      {pedidoImpresso && (
        <div ref={printRef} className="comanda-print">
          <div style={{ padding: "4mm" }}>
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "20px", marginBottom: 2 }}>RETIRADA: {pedidoImpresso.pickup_time || "-"}</p>
            <div className="divider" />
            <p style={{ textAlign: "center", fontWeight: 700, fontSize: "18px" }}>PADARIA DA ROSE</p>
            <p style={{ textAlign: "center", fontSize: "14px" }}>Pedido #{pedidoImpresso.id}</p>
            <p style={{ textAlign: "center", fontSize: "14px" }}>{new Date(pedidoImpresso.created_at).toLocaleString("pt-BR")}</p>
            <div className="divider" />
            <p style={{ fontWeight: 600, fontSize: "16px" }}>{pedidoImpresso.customer_name}</p>
            <p style={{ fontSize: "16px" }}>{pedidoImpresso.customer_phone}</p>
            {pedidoImpresso.employee_slug && <p style={{ fontSize: "14px" }}>Via: {pedidoImpresso.employee_slug}</p>}
            <div className="divider" />
            {(pedidoImpresso.order_items || []).map((it) => (
              <div key={it.id} style={{ marginBottom: 6 }}>
                <p style={{ fontWeight: 600, fontSize: "16px" }}>{it.qty}x {it.product_name} — {money(it.unit_price * it.qty)}</p>
                {it.observation && <p style={{ fontSize: "14px", fontStyle: "italic", paddingLeft: "4mm" }}>→ {it.observation}</p>}
              </div>
            ))}
            <div className="divider" />
            <p style={{ fontWeight: 700, fontSize: "18px" }}>TOTAL: {money(pedidoImpresso.total)}</p>
            {pedidoImpresso.notes && <p style={{ fontSize: "14px", fontStyle: "italic" }}>Obs: {pedidoImpresso.notes}</p>}
            <div style={{ height: "10mm" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABA PRODUTOS
   ═══════════════════════════════════════════════ */
function AbaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [novo, setNovo] = useState({ name: "", description: "", price: "", unit: "unid.", category: "paes", has_obs: false, obs_label: "Observação", image_url: "" });
  const [formOpen, setFormOpen] = useState(false);

  const carregar = async () => {
    const { data } = await supabase.from("products").select("*").order("category");
    setProdutos(data || []);
  };
  useEffect(() => { carregar(); }, []);

  const adicionar = async (e) => {
    e.preventDefault();
    await supabase.from("products").insert({
      name: novo.name, description: novo.description, price: Number(novo.price),
      unit: novo.unit, category: novo.category, has_obs: novo.has_obs, obs_label: novo.obs_label,
      image_url: novo.image_url || null
    });
    setNovo({ name: "", description: "", price: "", unit: "unid.", category: "paes", has_obs: false, obs_label: "Observação", image_url: "" });
    setFormOpen(false);
    carregar();
  };

  const alternarDisponibilidade = async (p) => {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    carregar();
  };

  const remover = async (id) => {
    if (!window.confirm("Remover este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    carregar();
  };

  const atualizarPreco = async (id, price) => {
    await supabase.from("products").update({ price: Number(price) }).eq("id", id);
  };

  const atualizarObs = async (id, hasObs, obsLabel) => {
    await supabase.from("products").update({ has_obs: hasObs, obs_label: obsLabel }).eq("id", id);
  };

  const atualizarFoto = async (id, imageUrl) => {
    await supabase.from("products").update({ image_url: imageUrl || null }).eq("id", id);
    carregar();
  };

  const catLabel = { paes: "Pães", domingo: "Domingo", bolos: "Bolos & Doces" };
  const catStyles = {
    paes:    { color: "#FBBF24", bg: "rgba(251,191,36,.12)",  border: "rgba(251,191,36,.25)"  },
    domingo: { color: "#F87171", bg: "rgba(248,113,113,.12)", border: "rgba(248,113,113,.25)" },
    bolos:   { color: "#C084FC", bg: "rgba(192,132,252,.12)", border: "rgba(192,132,252,.25)" },
  };

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em", marginBottom: 4 }}>Produtos</h2>
          <p style={{ fontSize: "0.83rem", color: "#475569" }}>{produtos.length} produtos cadastrados</p>
        </div>
        <button onClick={() => setFormOpen(!formOpen)} className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, fontSize: "0.88rem" }}>
          <Plus size={15} /> Novo produto
        </button>
      </div>

      {formOpen && (
        <div className="glass-card animate-fade-up" style={{ padding: "24px 26px", marginBottom: 24 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#E2E8F0", marginBottom: 18 }}>✦ Adicionar produto</h3>
          <form onSubmit={adicionar}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { placeholder: "Nome do produto", value: novo.name, key: "name", required: true },
                { placeholder: "Descrição", value: novo.description, key: "description" },
                { placeholder: "Preço", value: novo.price, key: "price", type: "number", required: true, step: "0.01" },
              ].map((f) => (
                <input key={f.key} required={f.required} type={f.type || "text"} step={f.step}
                  placeholder={f.placeholder} value={f.value}
                  onChange={(e) => setNovo({ ...novo, [f.key]: e.target.value })}
                  className="input-dark" style={{ padding: "11px 14px", fontSize: "0.9rem" }} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <select value={novo.category} onChange={(e) => setNovo({ ...novo, category: e.target.value })}
                  className="input-dark" style={{ padding: "11px 34px 11px 14px", fontSize: "0.9rem" }}>
                  <option value="paes">Pães</option>
                  <option value="domingo">Domingo</option>
                  <option value="bolos">Bolos & Doces</option>
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#475569" }} />
              </div>
              <input placeholder="Unidade (ex: unid., kg, dz)" value={novo.unit}
                onChange={(e) => setNovo({ ...novo, unit: e.target.value })}
                className="input-dark" style={{ padding: "11px 14px", fontSize: "0.9rem" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <input placeholder="URL da foto (opcional)" value={novo.image_url}
                onChange={(e) => setNovo({ ...novo, image_url: e.target.value })}
                className="input-dark" style={{ padding: "11px 14px", fontSize: "0.9rem" }} />
            </div>

            {/* Observação do produto */}
            <div style={{ 
              padding: "14px 16px", borderRadius: 12, marginBottom: 18,
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button type="button" onClick={() => setNovo({ ...novo, has_obs: !novo.has_obs })}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 13px", borderRadius: 9, border: "none", cursor: "pointer",
                    fontSize: "0.77rem", fontWeight: 600, transition: "all .18s",
                  background: novo.has_obs ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                  color: novo.has_obs ? "#34D399" : "#64748B"
                }}>
                  {novo.has_obs ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {novo.has_obs ? "Observação ativada" : "Observação desativada"}
                </button>
              </div>
              {novo.has_obs && (
                <input placeholder="Texto da observação (ex: Como deseja?)" value={novo.obs_label}
                  onChange={(e) => setNovo({ ...novo, obs_label: e.target.value })}
                  className="input-dark" style={{ padding: "10px 14px", fontSize: "0.88rem" }} />
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn-primary" style={{ padding: "11px 26px", borderRadius: 11, fontSize: "0.88rem" }}>
                Salvar produto
              </button>
              <button type="button" onClick={() => setFormOpen(false)} className="btn-ghost"
                style={{ padding: "11px 20px", borderRadius: 11, fontSize: "0.88rem" }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 100px 80px 1fr auto", gap: 0, padding: "13px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["Foto", "Nome", "Categoria", "Preço", "Unidade", "Obs", "Status", ""].map((h) => (
            <span key={h} style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334155" }}>{h}</span>
          ))}
        </div>

        {produtos.map((p, i) => {
          const cs = catStyles[p.category] || catStyles.paes;
          return (
            <div key={p.id} style={{
              display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 100px 80px 1fr auto",
              gap: 0, padding: "15px 22px", alignItems: "center",
              borderBottom: i < produtos.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              transition: "background .2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                onClick={() => {
                  const url = prompt("URL da foto do produto:", p.image_url || "");
                  if (url !== null) atualizarFoto(p.id, url);
                }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Package size={18} color="#334155" />
                )}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#E2E8F0", fontSize: "0.92rem" }}>{p.name}</p>
                {p.description && <p style={{ fontSize: "0.74rem", color: "#334155", marginTop: 2 }}>{p.description}</p>}
              </div>
              <span style={{
                display: "inline-flex", padding: "4px 11px", borderRadius: 100,
                background: cs.bg, color: cs.color, border: `1px solid ${cs.border}`,
                fontSize: "0.74rem", fontWeight: 600, width: "fit-content"
              }}>{catLabel[p.category] || p.category}</span>
              <input defaultValue={p.price} type="number" step="0.01"
                onBlur={(e) => atualizarPreco(p.id, e.target.value)}
                className="input-dark font-mono"
                style={{ width: 95, padding: "7px 10px", fontSize: "0.84rem", color: "#E8C36A" }} />
              <span style={{ fontSize: "0.82rem", color: "#475569" }}>{p.unit}</span>
              <ObsToggle product={p} onSave={atualizarObs} />
              <button onClick={() => alternarDisponibilidade(p)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 13px", borderRadius: 9, border: "none", cursor: "pointer",
                  fontSize: "0.77rem", fontWeight: 600, transition: "all .18s",
                background: p.available ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                color: p.available ? "#34D399" : "#F87171"
              }}>
                {p.available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {p.available ? "Disponível" : "Indisponível"}
              </button>
              <button onClick={() => remover(p.id)}
                style={{ padding: 8, borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.12)", color: "#F87171", cursor: "pointer", display: "flex", transition: "all .18s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {produtos.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Package size={32} color="#1E293B" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "#334155", fontSize: "0.9rem" }}>Nenhum produto cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ObsToggle({ product, onSave }) {
  const [editing, setEditing] = useState(false);
  const [hasObs, setHasObs] = useState(product.has_obs || false);
  const [obsLabel, setObsLabel] = useState(product.obs_label || "Observação");

  const handleSave = () => {
    onSave(product.id, hasObs, obsLabel);
    setEditing(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setEditing(!editing)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
          fontSize: "0.72rem", fontWeight: 600, transition: "all .18s",
            background: hasObs ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
            color: hasObs ? "#818CF8" : "#475569"
          }}>
        {hasObs ? "✓ Obs" : "—"}
      </button>
      {editing && (
        <div style={{
          position: "absolute", top: "100%", left: 0, zIndex: 10,
          marginTop: 6, padding: 12, borderRadius: 12,
          background: "rgba(15,18,30,0.95)", border: "1px solid rgba(99,102,241,0.3)",
          backdropFilter: "blur(12px)", minWidth: 200,
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => { setHasObs(!hasObs); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: "0.75rem", fontWeight: 600,
                background: hasObs ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                color: hasObs ? "#34D399" : "#64748B"
              }}>
              {hasObs ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
              {hasObs ? "Ativada" : "Desativada"}
            </button>
          </div>
          {hasObs && (
            <input value={obsLabel} onChange={(e) => setObsLabel(e.target.value)}
              placeholder="Texto da observação"
              className="input-dark" style={{ padding: "8px 12px", fontSize: "0.82rem", marginBottom: 8 }} />
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleSave} className="btn-primary"
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: "0.78rem" }}>
              Salvar
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost"
              style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.78rem" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABA FUNCIONÁRIOS
   ═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   ABA EQUIPE - Gerenciar atendentes
   ═══════════════════════════════════════════════ */
function AbaEquipe() {
  const [team, setTeam] = useState(getAttendants);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formEmoji, setFormEmoji] = useState("👨‍💼");
  const [formColor, setFormColor] = useState("#6366F1");

  useEffect(() => { saveAttendants(team); }, [team]);

  const resetForm = () => {
    setFormName("");
    setFormEmoji("👨‍💼");
    setFormColor("#6366F1");
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (att) => {
    setFormName(att.name);
    setFormEmoji(att.emoji);
    setFormColor(att.color);
    setEditingId(att.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingId) {
      setTeam(prev => prev.map(a => a.id === editingId ? { ...a, name: formName.trim(), emoji: formEmoji, color: formColor } : a));
    } else {
      const id = formName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();
      setTeam(prev => [...prev, { id, name: formName.trim(), emoji: formEmoji, color: formColor }]);
    }
    resetForm();
  };

  const removeAttendant = (id) => {
    if (!window.confirm("Remover este membro da equipe?")) return;
    setTeam(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Equipe
          </h2>
          <p style={{ fontSize: "0.83rem", color: "#475569" }}>Gerencie quem aparece na tela de seleção de atendente</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary" style={{
          display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 12, fontSize: "0.85rem", fontWeight: 600
        }}>
          <Plus size={15} /> Novo membro
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="animate-fade-in" style={{
          position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }} onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="animate-scale-in" style={{
            width: "100%", maxWidth: 420, background: "#0F1524", borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden"
          }}>
            <div style={{ padding: "24px 24px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#F1F5F9" }}>
                  {editingId ? "Editar membro" : "Novo membro"}
                </h3>
                <button onClick={resetForm} style={{
                  width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)", color: "#64748B", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}><X size={14} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "0 24px 24px" }}>
              {/* Preview */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${formColor}33, ${formColor}15)`,
                  border: `2px solid ${formColor}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", fontSize: "2rem"
                }}>
                  {formEmoji}
                </div>
                <p style={{ color: "#E2E8F0", fontWeight: 600, fontSize: "0.95rem", marginTop: 10 }}>
                  {formName || "Nome do membro"}
                </p>
              </div>

              {/* Name */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", marginBottom: 8 }}>
                  Nome
                </label>
                <input required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Gabriel"
                  className="input-dark" style={{ padding: "12px 16px", fontSize: "0.93rem" }} />
              </div>

              {/* Emoji */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", marginBottom: 8 }}>
                  Ícone
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ATTENDANT_EMOJIS.map((em) => (
                    <button key={em} type="button" onClick={() => setFormEmoji(em)} style={{
                      width: 40, height: 40, borderRadius: 10, fontSize: "1.2rem",
                      background: formEmoji === em ? "rgba(232,195,106,0.15)" : "rgba(255,255,255,0.04)",
                      border: formEmoji === em ? "2px solid #E8C36A" : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s"
                    }}>{em}</button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748B", marginBottom: 8 }}>
                  Cor
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ATTENDANT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setFormColor(c)} style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: c, border: formColor === c ? "3px solid #FFF" : "2px solid transparent",
                      cursor: "pointer", transition: "all 0.15s",
                      boxShadow: formColor === c ? `0 0 12px ${c}88` : "none"
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={resetForm} className="btn-ghost" style={{
                  flex: 1, padding: "12px", borderRadius: 12, fontSize: "0.88rem", fontWeight: 500
                }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{
                  flex: 1, padding: "12px", borderRadius: 12, fontSize: "0.88rem", fontWeight: 600
                }}>{editingId ? "Salvar" : "Adicionar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {team.map((att, i) => (
          <div key={att.id} className="glass-card animate-fade-up" style={{
            padding: "16px 20px", animationDelay: `${i * 0.04}s`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${att.color}33, ${att.color}15)`,
                border: `2px solid ${att.color}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem"
              }}>
                {att.emoji}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: "#E2E8F0", fontSize: "0.95rem" }}>{att.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: att.color, display: "inline-block" }} />
                  <span style={{ fontSize: "0.72rem", color: "#475569" }}>{att.color}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => openEdit(att)} style={{
                padding: "8px 14px", borderRadius: 9,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontSize: "0.81rem", fontWeight: 500, transition: "all .18s"
              }}>
                <Edit3 size={13} /> Editar
              </button>
              <button onClick={() => removeAttendant(att.id)} style={{
                padding: "8px 10px", borderRadius: 9,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                color: "#F87171", cursor: "pointer", display: "flex", transition: "all .18s"
              }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {team.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Users size={36} color="#1E293B" style={{ margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "#334155", fontSize: "0.92rem", fontWeight: 500 }}>Nenhum membro na equipe</p>
            <p style={{ color: "#1E293B", fontSize: "0.82rem", marginTop: 6 }}>Clique em "Novo membro" para adicionar</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABA CHAT - Reescrita do zero
   ═══════════════════════════════════════════════ */
function AbaChat({ session, attendantName }) {
  const [customerChats, setCustomerChats] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const employeeName = attendantName || "Atendente";

  const loadCustomerChats = useCallback(async () => {
    const { data: allMsgs } = await supabase
      .from("chat_messages")
      .select("employee_slug, sender_name, sender, message, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!allMsgs) return;

    const chatMap = {};
    allMsgs.forEach((msg) => {
      const slug = msg.employee_slug;
      if (!slug) return;
      if (!chatMap[slug]) {
        chatMap[slug] = {
          phone: slug,
          customerName: "",
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unread: 0,
        };
      }
      if (msg.sender === "customer" && !chatMap[slug].customerName) {
        chatMap[slug].customerName = msg.sender_name;
      }
      if (msg.sender === "customer" && !chatMap[slug].lastMessage) {
        chatMap[slug].lastMessage = msg.message;
        chatMap[slug].lastTime = msg.created_at;
      }
    });

    const sorted = Object.values(chatMap).sort(
      (a, b) => new Date(b.lastTime) - new Date(a.lastTime)
    );
    setCustomerChats(sorted);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!selectedPhone) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("employee_slug", selectedPhone)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  }, [selectedPhone]);

  useEffect(() => {
    loadCustomerChats();
    const interval = setInterval(loadCustomerChats, 3000);
    return () => clearInterval(interval);
  }, [loadCustomerChats]);

  useEffect(() => {
    if (!selectedPhone) { setMessages([]); return; }
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedPhone, loadMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedPhone) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      order_id: null,
      employee_slug: selectedPhone,
      sender: "seller",
      sender_name: employeeName,
      message: newMsg.trim(),
    });
    if (error) console.error("Erro ao enviar:", error);
    setNewMsg("");
    setSending(false);
    await loadMessages();
    await loadCustomerChats();
  };

  const deleteMessage = async (msgId) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", msgId);
    if (error) console.error("Erro ao apagar mensagem:", error);
    else {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      await loadCustomerChats();
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Hoje";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const selectedChat = customerChats.find(c => c.phone === selectedPhone);

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Chat com Clientes
        </h2>
        <p style={{ fontSize: "0.83rem", color: "#475569" }}>
          Conversas individuais — respondendo como <strong style={{ color: "#E8C36A" }}>{employeeName}</strong>
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, minHeight: 520 }}>
        {/* Customer list */}
        <div style={{ width: 280, flexShrink: 0, background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 14, paddingLeft: 4 }}>
            Conversas ({customerChats.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 460, overflowY: "auto" }}>
            {customerChats.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 12px" }}>
                <MessageCircle size={32} color="#1E293B" style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                <p style={{ color: "#475569", fontSize: "0.82rem" }}>Nenhuma conversa ainda</p>
              </div>
            )}
            {customerChats.map((chat) => {
              const isActive = selectedPhone === chat.phone;
              return (
                <button key={chat.phone} onClick={() => setSelectedPhone(chat.phone)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                    textAlign: "left", transition: "all .2s",
                    background: isActive ? "linear-gradient(135deg, #25D366, #128C7E)" : "transparent",
                    color: isActive ? "#FFFFFF" : "#CBD5E1",
                  }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: isActive ? "rgba(255,255,255,0.2)" : "rgba(37,211,102,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.88rem", fontWeight: 700,
                    color: isActive ? "#FFFFFF" : "#34D399"
                  }}>
                    {chat.customerName?.charAt(0)?.toUpperCase() || chat.phone?.slice(-2) || "?"}
                  </div>
                  <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chat.customerName || "Cliente"}
                      </p>
                      <span style={{ fontSize: "0.66rem", opacity: 0.5, flexShrink: 0, marginLeft: 6 }}>
                        {formatDate(chat.lastTime)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "0.75rem", opacity: 0.55, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                        {chat.lastMessage}
                      </p>
                      <span style={{ fontSize: "0.65rem", opacity: 0.4, flexShrink: 0 }}>
                        {formatTime(chat.lastTime)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.68rem", opacity: 0.35, marginTop: 2 }}>{chat.phone}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          {!selectedPhone ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <MessageCircle size={48} color="#1E293B" style={{ margin: "0 auto 14px", display: "block", opacity: 0.3 }} />
                <p style={{ color: "#475569", fontSize: "1rem", fontWeight: 500 }}>Selecione uma conversa</p>
                <p style={{ color: "#334155", fontSize: "0.82rem", marginTop: 4 }}>para começar a responder</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "rgba(37,211,102,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.88rem", fontWeight: 700, color: "#34D399"
                }}>
                  {selectedChat?.customerName?.charAt(0)?.toUpperCase() || selectedPhone?.slice(-2) || "?"}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: "#E2E8F0", fontSize: "0.95rem" }}>
                    {selectedChat?.customerName || "Cliente"}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#475569" }}>{selectedPhone}</p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, maxHeight: 380, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10, background: "rgba(0,0,0,0.15)" }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <p style={{ color: "#475569", fontSize: "0.88rem" }}>Nenhuma mensagem ainda</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender === "seller" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
                    <div style={{
                      maxWidth: "72%", padding: "10px 14px", borderRadius: 16,
                      background: msg.sender === "seller"
                        ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                        : "rgba(255,255,255,0.06)",
                      color: msg.sender === "seller" ? "#FFFFFF" : "#E2E8F0",
                      border: msg.sender === "seller" ? "none" : "1px solid rgba(255,255,255,0.08)"
                    }}>
                      <p style={{ fontWeight: 600, fontSize: "0.72rem", marginBottom: 3, opacity: 0.6 }}>{msg.sender_name}</p>
                      <p style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{msg.message}</p>
                      <p style={{ fontSize: "0.66rem", marginTop: 4, opacity: 0.4 }}>{formatTime(msg.created_at)}</p>
                    </div>
                    <button onClick={() => deleteMessage(msg.id)} title="Apagar mensagem" style={{
                      width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
                      background: "rgba(239,68,68,0.15)", color: "#EF4444",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: "0.75rem", opacity: 0.5, transition: "opacity 0.2s"
                    }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}>✕</button>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="input-dark"
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12, fontSize: "0.9rem" }}
                />
                <button onClick={sendMessage} disabled={sending || !newMsg.trim()} className="btn-primary"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 44, height: 44, borderRadius: 12,
                    opacity: sending || !newMsg.trim() ? 0.5 : 1
                  }}>
                  <Send size={16} color="#0D0F18" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

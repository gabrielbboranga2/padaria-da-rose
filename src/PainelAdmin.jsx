import React, { useState, useEffect, useRef } from "react";
import {
  Lock, LogOut, Package, ShoppingBag, Users, Plus, Trash2, Printer,
  Copy, Check, Wheat, ChevronDown, Bell, TrendingUp, Clock, AlertCircle,
  RefreshCw, Edit3, ToggleLeft, ToggleRight, Link2, Search
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
  novo:       { label: "Novo",       bg: "#EEF2FF", color: "#4338CA", dot: "#6366F1" },
  preparando: { label: "Preparando", bg: "#FFF7ED", color: "#C2410C", dot: "#F97316" },
  pronto:     { label: "Pronto",     bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" },
  entregue:   { label: "Entregue",   bg: "#F8FAFC", color: "#475569", dot: "#94A3B8" },
  cancelado:  { label: "Cancelado",  bg: "#FFF1F2", color: "#BE123C", dot: "#F43F5E" },
};

export default function PainelAdmin() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("pedidos");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!session) return <TelaLogin />;

  const TABS = [
    { id: "pedidos",      label: "Pedidos",       icon: ShoppingBag },
    { id: "produtos",     label: "Produtos",      icon: Package },
    { id: "funcionarios", label: "Funcionários",  icon: Users },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F1EC", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        @media print {
          body * { visibility: hidden; }
          .comanda-print, .comanda-print * { visibility: visible; }
          .comanda-print { position: fixed; top: 0; left: 0; width: 280px; }
        }
        .tab-btn { transition: all 0.2s ease; }
        .tab-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .admin-card { transition: box-shadow 0.2s ease; }
        .admin-card:hover { box-shadow: 0 6px 24px rgba(45,24,16,0.10) !important; }
        .btn-sm { transition: all 0.15s ease; }
        .btn-sm:hover { filter: brightness(0.94); }
        .btn-sm:active { transform: scale(0.97); }
        select { appearance: none; background-image: none; }
      `}</style>

      {/* ═══ TOPBAR ═══ */}
      <header style={{
        background: "linear-gradient(135deg, #1C0F08 0%, #2A1610 100%)",
        borderBottom: "1px solid rgba(232,195,106,0.12)",
        position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(232,195,106,0.2), 0 4px 14px rgba(0,0,0,0.35)"
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
            <div>
              <h1 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#FFF8F0", lineHeight: 1.1 }}>
                Padaria <span style={{ color: "#E8C36A" }}>da Rose</span>
              </h1>
              <p style={{ fontSize: "0.7rem", color: "#7A6B5D", letterSpacing: "0.04em" }}>Painel de gerenciamento</p>
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => supabase.auth.signOut()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 100,
                background: "rgba(232,195,106,0.08)", border: "1px solid rgba(232,195,106,0.18)",
                color: "#C4A98E", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer",
                transition: "all 0.2s"
              }}>
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, paddingBottom: 0 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "10px 18px", fontSize: "0.85rem", fontWeight: active ? 600 : 400,
                  color: active ? "#E8C36A" : "#8A7A6A",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: active ? "2px solid #E8C36A" : "2px solid transparent",
                  marginBottom: -1, transition: "all 0.2s", borderRadius: "4px 4px 0 0"
                }}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
        {tab === "pedidos"      && <AbaPedidos />}
        {tab === "produtos"     && <AbaProdutos />}
        {tab === "funcionarios" && <AbaFuncionarios />}
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
      padding: "24px", fontFamily: "'Inter', sans-serif",
      background: "linear-gradient(160deg, #1C0F08 0%, #2A1610 55%, #3A2218 100%)"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
            margin: "0 auto 16px",
            boxShadow: "0 0 0 1px rgba(232,195,106,0.2), 0 10px 36px rgba(0,0,0,0.5)"
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 700, color: "#FFF8F0", marginBottom: 4 }}>
            Painel da Rose
          </h2>
          <p style={{ fontSize: "0.83rem", color: "#7A6B5D" }}>Área restrita — acesso autorizado</p>
        </div>

        {/* Form */}
        <div style={{
          background: "#FDFBF8",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "9px 14px", borderRadius: 10, background: "rgba(45,24,16,0.05)" }}>
            <Lock size={15} color="#8A7A6A" />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#8A7A6A" }}>Acesso restrito</span>
          </div>

          <form onSubmit={entrar}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5C3D2E", marginBottom: 7 }}>E-mail</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="seu@email.com"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1.5px solid rgba(212,160,74,0.2)", background: "#FFFFFF",
                  color: "#2D1810", fontSize: "0.93rem", boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s", outline: "none"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#D4A04A"; e.target.style.boxShadow = "0 0 0 3px rgba(212,160,74,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,74,0.2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5C3D2E", marginBottom: 7 }}>Senha</label>
              <input value={senha} onChange={(e) => setSenha(e.target.value)} required type="password" placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1.5px solid rgba(212,160,74,0.2)", background: "#FFFFFF",
                  color: "#2D1810", fontSize: "0.93rem", boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s", outline: "none"
                }}
                onFocus={(e) => { e.target.style.borderColor = "#D4A04A"; e.target.style.boxShadow = "0 0 0 3px rgba(212,160,74,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,74,0.2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            {erro && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(184,74,74,0.07)", marginBottom: 16 }}>
                <AlertCircle size={14} color="#B84A4A" />
                <p style={{ fontSize: "0.85rem", color: "#B84A4A", margin: 0 }}>{erro}</p>
              </div>
            )}
            <button type="submit" disabled={carregando}
              style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                color: "#FFF8F0", fontWeight: 700, fontSize: "0.95rem",
                border: "none", cursor: carregando ? "not-allowed" : "pointer",
                boxShadow: "0 6px 20px rgba(45,24,16,0.28)", transition: "all 0.15s"
              }}>
              {carregando ? "Entrando…" : "Entrar"}
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
        setTimeout(() => setNovoPedidoId(null), 4000);
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  useEffect(() => {
    if (pedidoParaImprimir) {
      setTimeout(() => { window.print(); setTimeout(() => setPedidoParaImprimir(null), 1000); }, 300);
    }
  }, [pedidoParaImprimir]);

  const mudarStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    carregarPedidos();
  };

  const pedidoImpresso = pedidos.find((p) => p.id === pedidoParaImprimir);

  // Stats
  const novos = pedidos.filter((p) => p.status === "novo").length;
  const preparando = pedidos.filter((p) => p.status === "preparando").length;
  const totalHoje = pedidos.filter((p) => {
    const d = new Date(p.created_at);
    const hoje = new Date();
    return d.toDateString() === hoje.toDateString();
  }).reduce((s, p) => s + Number(p.total), 0);

  return (
    <div>
      {/* Info banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
        borderRadius: 12, background: "rgba(232,195,106,0.08)",
        border: "1px solid rgba(232,195,106,0.18)", marginBottom: 24
      }}>
        <Bell size={15} color="#D4A04A" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: "0.83rem", color: "#7A6B5D", margin: 0 }}>
          Deixe esta aba aberta — cada novo pedido toca um som e imprime a comanda automaticamente.
        </p>
        <button onClick={carregarPedidos}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: "rgba(212,160,74,0.1)", border: "1px solid rgba(212,160,74,0.2)", color: "#8A7A6A", fontSize: "0.78rem", cursor: "pointer" }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Novos", value: novos, color: "#4338CA", bg: "#EEF2FF", icon: <Bell size={18} color="#4338CA" /> },
          { label: "Preparando", value: preparando, color: "#C2410C", bg: "#FFF7ED", icon: <Clock size={18} color="#C2410C" /> },
          { label: "Faturado hoje", value: money(totalHoje), color: "#15803D", bg: "#F0FDF4", icon: <TrendingUp size={18} color="#15803D" />, mono: true },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#FFFFFF", borderRadius: 14, padding: "16px 20px",
            border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9A8A7A" }}>{s.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
            </div>
            <p style={{ fontSize: s.mono ? "1.1rem" : "1.7rem", fontWeight: 700, color: s.color, fontFamily: s.mono ? "'IBM Plex Mono', monospace" : "inherit", margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pedidos list */}
      {carregando ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9A8A7A" }}>
          <Wheat size={32} color="#D4A04A" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
          <p style={{ fontSize: "0.9rem" }}>Carregando pedidos…</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pedidos.map((p) => {
            const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.novo;
            const isNew = p.id === novoPedidoId;
            return (
              <div key={p.id} className="admin-card"
                style={{
                  background: "#FFFFFF", borderRadius: 16, overflow: "hidden",
                  border: `1px solid ${isNew ? "rgba(99,102,241,0.4)" : "rgba(0,0,0,0.06)"}`,
                  boxShadow: isNew ? "0 0 0 3px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.07)" : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.3s ease"
                }}>
                {/* Status bar top */}
                <div style={{ height: 3, background: sc.dot === "#6366F1" ? "linear-gradient(90deg,#6366F1,#818CF8)" : sc.dot === "#F97316" ? "linear-gradient(90deg,#F97316,#FBBF24)" : sc.dot === "#22C55E" ? "linear-gradient(90deg,#22C55E,#4ADE80)" : sc.dot === "#F43F5E" ? "linear-gradient(90deg,#F43F5E,#FB7185)" : "linear-gradient(90deg,#94A3B8,#CBD5E1)" }} />

                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "0.85rem", color: "#2D1810" }}>#{p.id}</span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 10px", borderRadius: 100,
                          background: sc.bg, color: sc.color,
                          fontSize: "0.72rem", fontWeight: 600
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
                          {sc.label}
                        </span>
                        {isNew && <span style={{ padding: "2px 8px", borderRadius: 100, background: "#EEF2FF", color: "#4338CA", fontSize: "0.7rem", fontWeight: 700 }}>NOVO</span>}
                      </div>
                      <p style={{ fontWeight: 700, color: "#1A1210", fontSize: "1rem", marginBottom: 3 }}>{p.customer_name}</p>
                      <p style={{ fontSize: "0.82rem", color: "#7A6B5D", marginBottom: 2 }}>{p.customer_phone} · Retirada: <strong style={{ color: "#5C3D2E" }}>{p.pickup_time}</strong></p>
                      {p.employee_slug && <p style={{ fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", color: "#B8743A" }}>via: {p.employee_slug}</p>}
                      {p.notes && <p style={{ fontSize: "0.78rem", color: "#8A7A6A", marginTop: 4, fontStyle: "italic" }}>Obs: {p.notes}</p>}
                    </div>

                    {/* Right actions */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "1.1rem", color: "#B85C1E" }}>{money(p.total)}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setPedidoParaImprimir(p.id)} className="btn-sm"
                          style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9,
                            background: "rgba(45,24,16,0.07)", border: "none", color: "#5C3D2E",
                            fontSize: "0.8rem", fontWeight: 500, cursor: "pointer"
                          }}>
                          <Printer size={13} /> Imprimir
                        </button>
                        <div style={{ position: "relative" }}>
                          <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)}
                            style={{
                              padding: "7px 32px 7px 12px", borderRadius: 9,
                              border: `1.5px solid ${sc.dot}33`,
                              background: sc.bg, color: sc.color,
                              fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", outline: "none",
                              fontFamily: "'Inter', sans-serif"
                            }}>
                            <option value="novo">Novo</option>
                            <option value="preparando">Preparando</option>
                            <option value="pronto">Pronto</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                          <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: sc.color }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  {p.order_items && p.order_items.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {p.order_items.map((it) => (
                          <span key={it.id} style={{
                            padding: "4px 12px", borderRadius: 8,
                            background: "#F7F4F0", fontSize: "0.8rem", color: "#5C3D2E"
                          }}>
                            <strong>{it.qty}×</strong> {it.product_name} · <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem" }}>{money(it.unit_price * it.qty)}</span>
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
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <ShoppingBag size={36} color="#D4A04A" style={{ margin: "0 auto 12px", display: "block", opacity: 0.25 }} />
              <p style={{ color: "#9A8A7A", fontSize: "0.95rem" }}>Nenhum pedido ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Print area */}
      {pedidoImpresso && (
        <div ref={printRef} className="comanda-print font-mono" style={{ display: "none" }}>
          <div className="comanda-print" style={{ padding: 12 }}>
            <p style={{ fontWeight: 700 }}>PADARIA DA ROSE</p>
            <p>Pedido #{pedidoImpresso.id}</p>
            <p>{pedidoImpresso.customer_name} — {pedidoImpresso.customer_phone}</p>
            <p>Retirada: {pedidoImpresso.pickup_time}</p>
            {pedidoImpresso.employee_slug && <p>Atendido via: {pedidoImpresso.employee_slug}</p>}
            <p>------------------------------</p>
            {(pedidoImpresso.order_items || []).map((it) => (
              <p key={it.id}>{it.qty}x {it.product_name} — {money(it.unit_price * it.qty)}</p>
            ))}
            <p>------------------------------</p>
            <p style={{ fontWeight: 700 }}>TOTAL: {money(pedidoImpresso.total)}</p>
            {pedidoImpresso.notes && <p>Obs: {pedidoImpresso.notes}</p>}
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
  const [novo, setNovo] = useState({ name: "", description: "", price: "", unit: "unid.", category: "paes" });
  const [formOpen, setFormOpen] = useState(false);

  const carregar = async () => {
    const { data } = await supabase.from("products").select("*").order("category");
    setProdutos(data || []);
  };
  useEffect(() => { carregar(); }, []);

  const adicionar = async (e) => {
    e.preventDefault();
    await supabase.from("products").insert({ ...novo, price: Number(novo.price) });
    setNovo({ name: "", description: "", price: "", unit: "unid.", category: "paes" });
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

  const catLabel = { paes: "Pães", domingo: "Domingo", bolos: "Bolos & Doces" };
  const catColor = { paes: "#D4A04A", domingo: "#E8635A", bolos: "#9B72D4" };

  return (
    <div>
      {/* Header with add button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 700, color: "#2D1810", marginBottom: 2 }}>Produtos</h2>
          <p style={{ fontSize: "0.83rem", color: "#9A8A7A" }}>{produtos.length} produtos cadastrados</p>
        </div>
        <button onClick={() => setFormOpen(!formOpen)} className="btn-sm"
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12,
            background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
            color: "#FFF8F0", fontWeight: 600, fontSize: "0.88rem", border: "none", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(45,24,16,0.25)"
          }}>
          <Plus size={15} /> Novo produto
        </button>
      </div>

      {/* Add form */}
      {formOpen && (
        <div style={{
          background: "#FFFFFF", borderRadius: 16, padding: "22px 24px", marginBottom: 20,
          border: "1px solid rgba(212,160,74,0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#2D1810", marginBottom: 16 }}>Adicionar produto</h3>
          <form onSubmit={adicionar}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 12, marginBottom: 12 }}>
              <input required placeholder="Nome do produto" value={novo.name} onChange={(e) => setNovo({ ...novo, name: e.target.value })}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(212,160,74,0.2)", fontSize: "0.9rem", color: "#2D1810", outline: "none", background: "#FDFBF8" }}
                onFocus={(e) => e.target.style.borderColor = "#D4A04A"} onBlur={(e) => e.target.style.borderColor = "rgba(212,160,74,0.2)"} />
              <input placeholder="Descrição" value={novo.description} onChange={(e) => setNovo({ ...novo, description: e.target.value })}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(212,160,74,0.2)", fontSize: "0.9rem", color: "#2D1810", outline: "none", background: "#FDFBF8" }}
                onFocus={(e) => e.target.style.borderColor = "#D4A04A"} onBlur={(e) => e.target.style.borderColor = "rgba(212,160,74,0.2)"} />
              <input required type="number" step="0.01" placeholder="Preço" value={novo.price} onChange={(e) => setNovo({ ...novo, price: e.target.value })}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(212,160,74,0.2)", fontSize: "0.9rem", color: "#2D1810", outline: "none", background: "#FDFBF8" }}
                onFocus={(e) => e.target.style.borderColor = "#D4A04A"} onBlur={(e) => e.target.style.borderColor = "rgba(212,160,74,0.2)"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ position: "relative" }}>
                <select value={novo.category} onChange={(e) => setNovo({ ...novo, category: e.target.value })}
                  style={{ width: "100%", padding: "10px 32px 10px 14px", borderRadius: 10, border: "1.5px solid rgba(212,160,74,0.2)", fontSize: "0.9rem", color: "#2D1810", outline: "none", background: "#FDFBF8", cursor: "pointer" }}>
                  <option value="paes">Pães</option>
                  <option value="domingo">Domingo</option>
                  <option value="bolos">Bolos & Doces</option>
                </select>
                <ChevronDown size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9A8A7A" }} />
              </div>
              <input placeholder="Unidade (ex: unid., kg, dz)" value={novo.unit} onChange={(e) => setNovo({ ...novo, unit: e.target.value })}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(212,160,74,0.2)", fontSize: "0.9rem", color: "#2D1810", outline: "none", background: "#FDFBF8" }}
                onFocus={(e) => e.target.style.borderColor = "#D4A04A"} onBlur={(e) => e.target.style.borderColor = "rgba(212,160,74,0.2)"} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit"
                style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg, #2D1810, #4A2C1A)", color: "#FFF8F0", fontWeight: 600, fontSize: "0.88rem", border: "none", cursor: "pointer" }}>
                Salvar produto
              </button>
              <button type="button" onClick={() => setFormOpen(false)}
                style={{ padding: "10px 20px", borderRadius: 10, background: "#F4F1EC", color: "#7A6B5D", fontWeight: 500, fontSize: "0.88rem", border: "none", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products table */}
      <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px 1fr auto", gap: 0, padding: "12px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", background: "#F9F7F4" }}>
          {["Nome", "Categoria", "Preço", "Unidade", "Status", ""].map((h) => (
            <span key={h} style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9A8A7A" }}>{h}</span>
          ))}
        </div>

        {produtos.map((p, i) => (
          <div key={p.id} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 100px 1fr auto",
            gap: 0, padding: "14px 20px", alignItems: "center",
            borderBottom: i < produtos.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
            background: i % 2 === 0 ? "#FFFFFF" : "#FDFBF8"
          }}>
            <div>
              <p style={{ fontWeight: 600, color: "#2D1810", fontSize: "0.92rem" }}>{p.name}</p>
              {p.description && <p style={{ fontSize: "0.76rem", color: "#9A8A7A", marginTop: 2 }}>{p.description}</p>}
            </div>
            <span style={{
              display: "inline-flex", padding: "3px 10px", borderRadius: 100,
              background: catColor[p.category] + "15", color: catColor[p.category],
              fontSize: "0.75rem", fontWeight: 600, width: "fit-content"
            }}>{catLabel[p.category] || p.category}</span>
            <div>
              <input defaultValue={p.price} type="number" step="0.01"
                onBlur={(e) => atualizarPreco(p.id, e.target.value)}
                style={{
                  width: 90, padding: "6px 10px", borderRadius: 8,
                  border: "1.5px solid rgba(212,160,74,0.2)",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.85rem", color: "#B85C1E",
                  background: "#FDFBF8", outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
                onBlur2={(e) => e.target.style.borderColor = "rgba(212,160,74,0.2)"}
              />
            </div>
            <span style={{ fontSize: "0.83rem", color: "#7A6B5D" }}>{p.unit}</span>
            <button onClick={() => alternarDisponibilidade(p)} className="btn-sm"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 8, border: "none",
                background: p.available ? "#F0FDF4" : "#FFF1F2",
                color: p.available ? "#15803D" : "#BE123C",
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer"
              }}>
              {p.available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {p.available ? "Disponível" : "Indisponível"}
            </button>
            <button onClick={() => remover(p.id)} className="btn-sm"
              style={{ padding: 8, borderRadius: 8, background: "none", border: "none", color: "#D4756A", cursor: "pointer", display: "flex" }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {produtos.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Package size={32} color="#D4A04A" style={{ margin: "0 auto 12px", display: "block", opacity: 0.25 }} />
            <p style={{ color: "#9A8A7A", fontSize: "0.9rem" }}>Nenhum produto cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ABA FUNCIONÁRIOS
═══════════════════════════════════════════════ */
function AbaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [nome, setNome] = useState("");
  const [copiado, setCopiado] = useState(null);

  const carregar = async () => {
    const { data } = await supabase.from("employees").select("*").order("created_at");
    setFuncionarios(data || []);
  };
  useEffect(() => { carregar(); }, []);

  const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const adicionar = async (e) => {
    e.preventDefault();
    await supabase.from("employees").insert({ name: nome, slug: slugify(nome) });
    setNome("");
    carregar();
  };

  const remover = async (id) => {
    if (!window.confirm("Remover este funcionário?")) return;
    await supabase.from("employees").delete().eq("id", id);
    carregar();
  };

  const copiarLink = (slug) => {
    const link = `${window.location.origin.replace("/admin", "")}/?func=${slug}`;
    navigator.clipboard.writeText(link);
    setCopiado(slug);
    setTimeout(() => setCopiado(null), 1800);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 700, color: "#2D1810", marginBottom: 2 }}>Funcionários</h2>
          <p style={{ fontSize: "0.83rem", color: "#9A8A7A" }}>Gere links personalizados para cada atendente</p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={adicionar} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input required placeholder="Nome do funcionário" value={nome} onChange={(e) => setNome(e.target.value)}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 12,
            border: "1.5px solid rgba(212,160,74,0.2)", background: "#FFFFFF",
            color: "#2D1810", fontSize: "0.92rem", outline: "none"
          }}
          onFocus={(e) => { e.target.style.borderColor = "#D4A04A"; e.target.style.boxShadow = "0 0 0 3px rgba(212,160,74,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,74,0.2)"; e.target.style.boxShadow = "none"; }}
        />
        <button type="submit" className="btn-sm"
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 12,
            background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
            color: "#FFF8F0", fontWeight: 600, fontSize: "0.88rem", border: "none", cursor: "pointer",
            boxShadow: "0 4px 14px rgba(45,24,16,0.25)"
          }}>
          <Plus size={15} /> Adicionar
        </button>
      </form>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {funcionarios.map((f) => {
          const link = `${window.location.origin.replace("/admin", "")}/?func=${f.slug}`;
          const copied = copiado === f.slug;
          return (
            <div key={f.id} className="admin-card"
              style={{
                background: "#FFFFFF", borderRadius: 14, padding: "16px 20px",
                border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap"
              }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <p style={{ fontWeight: 600, color: "#2D1810", fontSize: "0.95rem", marginBottom: 4 }}>{f.name}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.73rem", color: "#9A8A7A", wordBreak: "break-all" }}>{link}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => copiarLink(f.slug)} className="btn-sm"
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9,
                    background: copied ? "#F0FDF4" : "rgba(45,24,16,0.06)",
                    border: `1px solid ${copied ? "#22C55E33" : "rgba(0,0,0,0.06)"}`,
                    color: copied ? "#15803D" : "#5C3D2E",
                    fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s"
                  }}>
                  {copied ? <Check size={13} /> : <Link2 size={13} />}
                  {copied ? "Copiado!" : "Copiar link"}
                </button>
                <button onClick={() => remover(f.id)} className="btn-sm"
                  style={{ padding: "8px 10px", borderRadius: 9, background: "#FFF1F2", border: "none", color: "#BE123C", cursor: "pointer", display: "flex" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {funcionarios.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Users size={32} color="#D4A04A" style={{ margin: "0 auto 12px", display: "block", opacity: 0.25 }} />
            <p style={{ color: "#9A8A7A", fontSize: "0.9rem" }}>Nenhum funcionário cadastrado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}

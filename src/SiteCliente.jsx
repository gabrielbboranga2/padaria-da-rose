import React, { useState, useMemo, useEffect } from "react";
import { Wheat, Flame, Cookie, Plus, Minus, Phone, Clock, X, Check, ShoppingBag, AlertTriangle, Copy, Star, MapPin } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const CATEGORIES = [
  { id: "paes", label: "Pães", icon: Wheat },
  { id: "domingo", label: "Domingo", icon: Flame },
  { id: "bolos", label: "Bolos & Doces", icon: Cookie },
];

const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function BreadDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #D4A04A66, transparent)" }} />
      <Wheat size={16} color="#D4A04A" strokeWidth={1.5} />
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #D4A04A66, transparent)" }} />
    </div>
  );
}

export default function SiteCliente() {
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState("paes");
  const [cart, setCart] = useState({});
  const [ticketOpen, setTicketOpen] = useState(false);
  const [step, setStep] = useState("menu");
  const [customer, setCustomer] = useState({ nome: "", telefone: "", retirada: "", obs: "" });
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [localOrder, setLocalOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connectionOk, setConnectionOk] = useState(true);

  const employeeSlug = useMemo(() => new URLSearchParams(window.location.search).get("func"), []);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .order("category")
      .then(({ data, error }) => {
        setLoading(false);
        if (!error) setProducts(data || []);
      });
  }, []);

  useEffect(() => {
    if (step === "menu") setOrderError(null);
  }, [step]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ ...products.find((p) => p.id === id), qty })),
    [cart, products]
  );

  const total = cartItems.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const addItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));

  const submitOrder = async (e) => {
    e.preventDefault();
    setStep("enviando");

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.nome,
        customer_phone: customer.telefone,
        pickup_time: customer.retirada,
        notes: customer.obs,
        employee_slug: employeeSlug,
        total,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao enviar pedido:", error);
      setConnectionOk(false);
      const fallback = {
        id: Date.now().toString().slice(-6),
        customer: { ...customer },
        items: [...cartItems],
        total,
        created_at: new Date().toLocaleString("pt-BR"),
      };
      const saved = JSON.parse(localStorage.getItem("orders_fallback") || "[]");
      saved.push(fallback);
      localStorage.setItem("orders_fallback", JSON.stringify(saved));
      setLocalOrder(fallback);
      setOrderError(error.message);
      setStep("fallback");
      return;
    }

    const items = cartItems.map((i) => ({
      order_id: order.id,
      product_name: i.name,
      qty: i.qty,
      unit_price: i.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);

    if (itemsError) {
      console.error("Erro ao enviar itens do pedido:", itemsError);
      setConnectionOk(false);
      const fallback = {
        id: order.id.toString(),
        customer: { ...customer },
        items: [...cartItems],
        total,
        created_at: new Date().toLocaleString("pt-BR"),
      };
      const saved = JSON.parse(localStorage.getItem("orders_fallback") || "[]");
      saved.push(fallback);
      localStorage.setItem("orders_fallback", JSON.stringify(saved));
      setLocalOrder(fallback);
      setOrderError(itemsError.message);
      setStep("fallback");
      return;
    }

    setOrderNumber(order.id);
    setStep("enviado");
  };

  const copyOrderDetails = () => {
    if (!localOrder) return;
    const text = `PADARIA DA ROSE - Pedido #${localOrder.id}
${localOrder.customer.nome} - ${localOrder.customer.telefone}
Retirada: ${localOrder.customer.retirada}
${localOrder.items.map((i) => `${i.qty}x ${i.name} - ${money(i.price * i.qty)}`).join("\n")}
TOTAL: ${money(localOrder.total)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#FAF6F1", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono-ticket { font-family: 'IBM Plex Mono', monospace; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.8); opacity:0; } 70% { transform: scale(1.05); } 100% { transform: scale(1); opacity:1; } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }

        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-fade-in { animation: fadeIn 0.4s ease both; }
        .animate-pop-in { animation: popIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-pulse-slow { animation: pulse 2.5s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }

        .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(93, 60, 46, 0.13) !important; }
        .btn-press { transition: all 0.15s ease; }
        .btn-press:active { transform: scale(0.96); }
        .btn-hover:hover { filter: brightness(1.05); }

        input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(212, 160, 74, 0.18); }
        input::placeholder, textarea::placeholder { color: #C5B5A5; }

        .category-pill { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
        .category-pill:hover { transform: translateY(-1px); }

        .gold-shine {
          background: linear-gradient(90deg, #D4A04A 0%, #F0C96A 40%, #D4A04A 60%, #B8883A 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{ background: "linear-gradient(160deg, #1C0F08 0%, #2A1610 45%, #3A2218 100%)", position: "relative", overflow: "hidden" }}>
        {/* Decorative background elements */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-40%", left: "-10%", width: "60%", height: "160%", background: "radial-gradient(ellipse, rgba(232,195,106,0.06) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "50%", height: "120%", background: "radial-gradient(ellipse, rgba(212,160,74,0.04) 0%, transparent 60%)" }} />
          {/* Horizontal line accent */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(232,195,106,0.3), transparent)" }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center text-center relative" style={{ zIndex: 1 }}>
          {/* Logo — sem borda extra, com brilho suave */}
          <div className="mb-8 animate-fade-up" style={{ animationDelay: "0s" }}>
            <div style={{
              width: 120, height: 120,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(232,195,106,0.25), 0 12px 40px rgba(0,0,0,0.45)",
              position: "relative"
            }}>
              <img
                src="/logo.png"
                alt="Padaria da Rose"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>

          <h1 className="font-display animate-fade-up" style={{
            fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
            fontWeight: 700,
            color: "#FFF8F0",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            animationDelay: "0.08s"
          }}>
            Padaria <span style={{ color: "#E8C36A" }}>da Rose</span>
          </h1>

          {/* Divider ornament */}
          <div className="flex items-center gap-4 my-5 animate-fade-up" style={{ animationDelay: "0.14s" }}>
            <div style={{ height: 1, width: 48, background: "linear-gradient(90deg, transparent, rgba(232,195,106,0.5))" }} />
            <Wheat size={15} color="rgba(232,195,106,0.7)" strokeWidth={1.5} />
            <div style={{ height: 1, width: 48, background: "linear-gradient(90deg, rgba(232,195,106,0.5), transparent)" }} />
          </div>

          <p className="animate-fade-up" style={{
            color: "#C4A98E",
            fontSize: "1.05rem",
            maxWidth: 400,
            lineHeight: 1.65,
            animationDelay: "0.18s"
          }}>
            Pães artesanais, bolos e doces feitos com carinho.<br />
            <span style={{ color: "#8A7A6A", fontSize: "0.9rem" }}>Encomende e retire na padaria.</span>
          </p>

          {/* Info chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7 animate-fade-up" style={{ animationDelay: "0.22s" }}>
            <a href="tel:+5518991914512" style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(232,195,106,0.18)",
              color: "#C4A98E", fontSize: "0.85rem",
              textDecoration: "none", transition: "all 0.2s"
            }}>
              <Phone size={13} color="#E8C36A" /> (18) 99191-4512
            </a>
            <span style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 100,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(232,195,106,0.18)",
              color: "#C4A98E", fontSize: "0.85rem"
            }}>
              <Clock size={13} color="#E8C36A" /> Ter–Dom, 6h–19h
            </span>
          </div>
        </div>

        {/* Wave transition */}
        <div style={{
          height: 52,
          background: "#FAF6F1",
          clipPath: "ellipse(60% 100% at 50% 100%)",
          marginTop: -1
        }} />
      </header>

      {/* ═══ OFFLINE BANNER ═══ */}
      {!connectionOk && (
        <div className="max-w-5xl mx-auto px-5 pt-4">
          <div className="rounded-2xl p-4 flex items-start gap-3 animate-fade-up" style={{ background: "#FFF3E0", border: "1px solid #FFD08A" }}>
            <AlertTriangle size={17} color="#D46B00" style={{ marginTop: 1, flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#5C3D2E" }}>
              <strong style={{ color: "#B84A00" }}>Sistema offline.</strong> Seu pedido será salvo localmente. Ao finalizar, encaminhe os detalhes para a padaria.
            </p>
          </div>
        </div>
      )}

      {/* ═══ MENU ═══ */}
      {step === "menu" && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-32 animate-fade-up">
          {/* Category nav */}
          <nav className="flex gap-2.5 overflow-x-auto py-6 sticky top-0 z-20" style={{
            background: "rgba(250, 246, 241, 0.97)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(212, 160, 74, 0.1)",
            scrollbarWidth: "none"
          }}>
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className="category-pill flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #2D1810, #4A2C1A)" : "#FFFFFF",
                    color: isActive ? "#FFF8F0" : "#5C3D2E",
                    border: "1px solid",
                    borderColor: isActive ? "transparent" : "rgba(212, 160, 74, 0.18)",
                    boxShadow: isActive ? "0 6px 18px rgba(45,24,16,0.22)" : "0 1px 4px rgba(0,0,0,0.05)"
                  }}>
                  <Icon size={15} /> {c.label}
                </button>
              );
            })}
          </nav>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <Wheat size={36} color="#D4A04A" className="animate-pulse-slow" />
              <span style={{ color: "#9A8A7A", fontSize: "0.9rem" }}>Carregando cardápio…</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {products.filter((p) => p.category === activeCat).map((p, idx) => (
                <div key={p.id} className="card-hover rounded-2xl overflow-hidden"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(212,160,74,0.10)",
                    boxShadow: "0 2px 12px rgba(93,60,46,0.06)",
                    opacity: p.available ? 1 : 0.5,
                    animation: `fadeUp 0.4s ease-out ${idx * 0.07}s both`
                  }}>
                  {/* Top accent bar */}
                  <div style={{
                    height: 3,
                    background: p.available
                      ? "linear-gradient(90deg, #C9893A, #E8C36A, #C9893A)"
                      : "#E8E0D8"
                  }} />
                  <div style={{ padding: "20px 20px 18px" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div style={{ flex: 1 }}>
                        <h3 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 600, color: "#2D1810", lineHeight: 1.2 }}>{p.name}</h3>
                        {p.description && (
                          <p style={{ fontSize: "0.82rem", color: "#8A7A6A", marginTop: 6, lineHeight: 1.55 }}>{p.description}</p>
                        )}
                      </div>
                      {!p.available && (
                        <span style={{
                          fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em",
                          padding: "3px 10px", borderRadius: 100,
                          background: "rgba(180,70,70,0.07)", color: "#B84A4A",
                          border: "1px solid rgba(180,70,70,0.14)", flexShrink: 0,
                          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500
                        }}>
                          Esgotado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid rgba(212,160,74,0.1)" }}>
                      <div>
                        <span className="font-mono-ticket" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#B85C1E" }}>
                          {money(p.price)}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#9A8A7A", marginLeft: 4 }}>/ {p.unit}</span>
                      </div>
                      {p.available ? (
                        (cart[p.id] || 0) > 0 ? (
                          <div className="flex items-center gap-2.5">
                            <button onClick={() => removeItem(p.id)} className="btn-press"
                              style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: "#F2E8DC", border: "1px solid rgba(212,160,74,0.2)",
                                color: "#5C3D2E", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer"
                              }}>
                              <Minus size={13} />
                            </button>
                            <span className="font-mono-ticket" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2D1810", width: 24, textAlign: "center" }}>{cart[p.id]}</span>
                            <button onClick={() => addItem(p.id)} className="btn-press"
                              style={{
                                width: 34, height: 34, borderRadius: "50%",
                                background: "linear-gradient(135deg, #C9893A, #D4A04A)",
                                color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 3px 10px rgba(212,160,74,0.35)", cursor: "pointer", border: "none"
                              }}>
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addItem(p.id)} className="btn-press btn-hover"
                            style={{
                              fontSize: "0.83rem", fontWeight: 600,
                              padding: "9px 18px", borderRadius: 100,
                              background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                              color: "#FFF8F0", border: "none",
                              boxShadow: "0 4px 14px rgba(45,24,16,0.22)",
                              display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
                            }}>
                            <Plus size={13} /> Adicionar
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "#9A8A7A", padding: "6px 12px", background: "rgba(154,138,122,0.07)", borderRadius: 100 }}>
                          Em breve
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {products.filter((p) => p.category === activeCat).length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-20">
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(212,160,74,0.07)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <Cookie size={30} color="#D4A04A" />
                  </div>
                  <p className="font-display" style={{ color: "#5C3D2E", fontSize: "1.1rem" }}>Nenhum produto nesta categoria.</p>
                  <p style={{ color: "#9A8A7A", fontSize: "0.85rem", marginTop: 6 }}>Volte em breve para conferir as novidades!</p>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ═══ DADOS ═══ */}
      {step === "dados" && (
        <main className="max-w-lg mx-auto px-5 py-12 animate-fade-up">
          <button onClick={() => setStep("menu")}
            className="btn-press flex items-center gap-2.5 mb-8 group"
            style={{ background: "none", border: "none", color: "#5C3D2E", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500 }}>
            <span style={{
              width: 34, height: 34, borderRadius: "50%", background: "#EDE0D4",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s"
            }}>←</span>
            Voltar ao cardápio
          </button>

          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            border: "1px solid rgba(212,160,74,0.14)",
            boxShadow: "0 8px 36px rgba(93,60,46,0.09)",
            overflow: "hidden"
          }}>
            {/* Form header */}
            <div style={{ padding: "28px 28px 0" }}>
              <h2 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2D1810", marginBottom: 6 }}>Seus dados</h2>
              <p style={{ fontSize: "0.88rem", color: "#7A6B5D", marginBottom: 28 }}>Para o padeiro saber quem retira e quando.</p>
            </div>

            <form onSubmit={submitOrder} style={{ padding: "0 28px 28px" }}>
              {[
                { label: "Nome completo", key: "nome", placeholder: "Seu nome completo", type: "text" },
                { label: "Telefone", key: "telefone", placeholder: "(18) 9XXXX-XXXX", type: "tel" },
                { label: "Horário de retirada", key: "retirada", placeholder: "Ex: hoje às 17h", type: "text" },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5C3D2E", marginBottom: 7 }}>
                    {field.label}
                  </label>
                  <input
                    required
                    type={field.type}
                    value={customer[field.key]}
                    onChange={(e) => setCustomer({ ...customer, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 12,
                      border: "1.5px solid rgba(212,160,74,0.2)",
                      background: "#FDFBF8", color: "#2D1810", fontSize: "0.93rem",
                      transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box"
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#D4A04A"; e.target.style.boxShadow = "0 0 0 3px rgba(212,160,74,0.12)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,74,0.2)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "0.73rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5C3D2E", marginBottom: 7 }}>
                  Observações <span style={{ color: "#9A8A7A", fontWeight: 400, textTransform: "none" }}>(opcional)</span>
                </label>
                <textarea
                  value={customer.obs}
                  onChange={(e) => setCustomer({ ...customer, obs: e.target.value })}
                  rows={3}
                  placeholder="Ex: pão de queijo sem sal, sem glúten…"
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: 12,
                    border: "1.5px solid rgba(212,160,74,0.2)",
                    background: "#FDFBF8", color: "#2D1810", fontSize: "0.93rem",
                    resize: "none", transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box"
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#D4A04A"; e.target.style.boxShadow = "0 0 0 3px rgba(212,160,74,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(212,160,74,0.2)"; e.target.style.boxShadow = "none"; }}
                />
              </div>

              {/* Order summary */}
              <div style={{
                background: "linear-gradient(135deg, #FDF8F0, #F7EDDF)",
                border: "1px solid rgba(212,160,74,0.18)",
                borderRadius: 14, padding: "16px 18px", marginBottom: 20
              }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#5C3D2E", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShoppingBag size={13} color="#D4A04A" /> Resumo do pedido
                </p>
                {cartItems.map((i) => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", color: "#5C3D2E", padding: "5px 0" }}>
                    <span>{i.qty}x {i.name}</span>
                    <span className="font-mono-ticket" style={{ fontWeight: 500 }}>{money(i.price * i.qty)}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1.5px dashed rgba(212,160,74,0.25)", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", color: "#2D1810" }}>
                  <span>TOTAL</span>
                  <span className="font-mono-ticket" style={{ color: "#B85C1E" }}>{money(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={itemCount === 0 || step === "enviando"} className="btn-press btn-hover"
                style={{
                  width: "100%", padding: "15px", borderRadius: 14,
                  background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                  color: "#FFF8F0", fontWeight: 700, fontSize: "1rem",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 6px 22px rgba(45,24,16,0.28)",
                  opacity: itemCount === 0 ? 0.4 : 1
                }}>
                {step === "enviando" ? "Enviando..." : "Confirmar encomenda →"}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ═══ ENVIANDO ═══ */}
      {step === "enviando" && (
        <main className="max-w-md mx-auto px-6 py-24 text-center animate-fade-in">
          <Wheat size={38} color="#D4A04A" style={{ margin: "0 auto 16px" }} className="animate-pulse-slow" />
          <p className="font-display" style={{ fontSize: "1.3rem", color: "#2D1810" }}>Enviando sua encomenda…</p>
        </main>
      )}

      {/* ═══ ENVIADO ═══ */}
      {step === "enviado" && (
        <main className="max-w-lg mx-auto px-5 py-20 text-center animate-fade-up">
          <div className="animate-pop-in" style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 28px",
            background: "linear-gradient(135deg, #4A7C59, #3D6B4E)",
            boxShadow: "0 10px 36px rgba(74,124,89,0.32)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Check size={38} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h2 className="font-display" style={{ fontSize: "2rem", fontWeight: 700, color: "#2D1810", marginBottom: 14 }}>Pedido confirmado!</h2>
          <p style={{ fontSize: "1rem", color: "#7A6B5D", lineHeight: 1.7 }}>
            A comanda nº <b className="font-mono-ticket" style={{ fontSize: "1.1rem", color: "#B85C1E" }}>#{orderNumber}</b> já chegou na padaria.
          </p>
          <p style={{ fontSize: "0.88rem", color: "#9A8A7A", marginTop: 8 }}>A Rose vai confirmar com você em breve pelo telefone.</p>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <a href="tel:+5518991914512" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 24px", borderRadius: 14,
              background: "#F2E8DC", border: "1px solid rgba(212,160,74,0.2)",
              color: "#5C3D2E", textDecoration: "none", fontSize: "0.9rem", transition: "all 0.2s"
            }}>
              <Phone size={15} color="#D4A04A" />
              Precisa falar? <strong>(18) 99191-4512</strong>
            </a>
            <button onClick={() => { setCart({}); setCustomer({ nome: "", telefone: "", retirada: "", obs: "" }); setStep("menu"); }}
              className="btn-press"
              style={{
                padding: "13px 32px", borderRadius: 100,
                background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                color: "#FFF8F0", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer",
                boxShadow: "0 6px 20px rgba(45,24,16,0.28)"
              }}>
              Fazer outra encomenda
            </button>
          </div>
        </main>
      )}

      {/* ═══ FALLBACK ═══ */}
      {step === "fallback" && localOrder && (
        <main className="max-w-md mx-auto px-5 py-10 animate-fade-up">
          <div style={{ borderRadius: 16, padding: "16px 20px", marginBottom: 20, background: "#FFF3E0", border: "1px solid #FFD08A", textAlign: "center" }}>
            <AlertTriangle size={22} color="#D46B00" style={{ margin: "0 auto 8px" }} />
            <h3 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#B84A00", marginBottom: 6 }}>Sistema temporariamente offline</h3>
            <p style={{ fontSize: "0.85rem", color: "#5C3D2E", lineHeight: 1.6 }}>
              Não foi possível conectar automaticamente. Copie ou anote os dados e nos envie pelo WhatsApp.
            </p>
          </div>

          <div className="font-mono-ticket" style={{ background: "#FFFFFF", borderRadius: 18, padding: "22px 24px", border: "1px solid rgba(212,160,74,0.2)", boxShadow: "0 4px 20px rgba(93,60,46,0.07)" }}>
            <p style={{ fontWeight: 700, fontSize: "1rem", color: "#2D1810" }}>PADARIA DA ROSE</p>
            <p style={{ color: "#5C3D2E", marginTop: 2 }}>Pedido #{localOrder.id}</p>
            <p style={{ fontSize: "0.78rem", color: "#7A6B5D" }}>{localOrder.created_at}</p>
            <BreadDivider />
            <p style={{ color: "#2D1810", fontWeight: 600 }}>{localOrder.customer.nome}</p>
            <p style={{ color: "#5C3D2E" }}>{localOrder.customer.telefone}</p>
            <p style={{ color: "#5C3D2E" }}>Retirada: {localOrder.customer.retirada}</p>
            {localOrder.customer.obs && <p style={{ marginTop: 4, fontSize: "0.8rem", color: "#7A6B5D" }}>Obs: {localOrder.customer.obs}</p>}
            <BreadDivider />
            {localOrder.items.map((i, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#2D1810" }}>
                <span>{i.qty}x {i.name}</span>
                <span>{money(i.price * i.qty)}</span>
              </div>
            ))}
            <BreadDivider />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05rem", color: "#2D1810" }}>
              <span>TOTAL</span>
              <span>{money(localOrder.total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <a href="https://wa.me/5518991914512" target="_blank" rel="noopener noreferrer"
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: "linear-gradient(135deg, #4A7C59, #3D6B4E)",
                color: "#FFFFFF", fontWeight: 600, textAlign: "center",
                display: "block", textDecoration: "none", boxShadow: "0 4px 14px rgba(74,124,89,0.28)"
              }}>
              Enviar pelo WhatsApp
            </a>
            <button onClick={copyOrderDetails} className="btn-press"
              style={{
                width: "100%", padding: "12px", borderRadius: 14,
                background: "#F2E8DC", color: "#5C3D2E", fontWeight: 500,
                border: "1px solid rgba(212,160,74,0.2)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
              {copied ? <><Check size={15} /> Copiado!</> : <><Copy size={15} /> Copiar pedido</>}
            </button>
            <button onClick={() => { setStep("menu"); setOrderError(null); }}
              style={{ width: "100%", padding: "10px", borderRadius: 14, background: "none", color: "#7A6B5D", fontSize: "0.88rem", border: "none", cursor: "pointer" }}>
              Tentar novamente
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#7A6B5D", marginTop: 20 }}>
            Ou ligue: <strong style={{ color: "#5C3D2E" }}>(18) 99191-4512</strong>
          </p>
        </main>
      )}

      {/* ═══ FLOATING CART BUTTON ═══ */}
      {step === "menu" && itemCount > 0 && (
        <button onClick={() => setTicketOpen(true)} className="animate-slide-up btn-press"
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 16,
            padding: "14px 26px", borderRadius: 100,
            background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
            color: "#FFF8F0", border: "none", cursor: "pointer",
            boxShadow: "0 10px 36px rgba(45,24,16,0.42)",
            zIndex: 30, whiteSpace: "nowrap"
          }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,195,106,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={15} color="#E8C36A" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
          <span style={{ width: 1, height: 22, background: "rgba(232,195,106,0.25)" }} />
          <span className="font-mono-ticket" style={{ fontWeight: 700, color: "#E8C36A", fontSize: "1rem" }}>{money(total)}</span>
        </button>
      )}

      {/* ═══ CART MODAL ═══ */}
      {ticketOpen && (
        <div className="animate-fade-in" style={{
          position: "fixed", inset: 0, zIndex: 40,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          background: "rgba(20,10,5,0.72)"
        }} onClick={(e) => { if (e.target === e.currentTarget) setTicketOpen(false); }}>
          <div className="animate-slide-up" style={{
            width: "100%", maxWidth: 440, maxHeight: "88vh",
            overflowY: "auto", borderRadius: "24px 24px 0 0",
            background: "#FFFFFF",
            boxShadow: "0 -12px 48px rgba(0,0,0,0.22)"
          }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E8DDD5" }} />
            </div>

            <div style={{ padding: "12px 24px 28px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #D4A04A, #E8C36A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShoppingBag size={18} color="#FFFFFF" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: "#2D1810", fontSize: "1rem" }}>Seu Pedido</p>
                    <p style={{ fontSize: "0.75rem", color: "#9A8A7A" }}>{new Date().toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <button onClick={() => setTicketOpen(false)} className="btn-press"
                  style={{ width: 36, height: 36, borderRadius: "50%", background: "#F2E8DC", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={15} color="#5C3D2E" />
                </button>
              </div>

              <div style={{ height: 1, background: "repeating-linear-gradient(90deg, rgba(212,160,74,0.3) 0, rgba(212,160,74,0.3) 6px, transparent 6px, transparent 12px)" }} />

              {/* Items */}
              <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 6 }}>
                {cartItems.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <ShoppingBag size={30} color="#D4A04A" style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                    <p style={{ color: "#9A8A7A", fontSize: "0.9rem" }}>Sua comanda está vazia.</p>
                  </div>
                )}
                {cartItems.map((i) => (
                  <div key={i.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => removeItem(i.id)} className="btn-press"
                          style={{ width: 26, height: 26, borderRadius: "50%", background: "#F2E8DC", border: "1px solid rgba(212,160,74,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Minus size={10} color="#5C3D2E" />
                        </button>
                        <span className="font-mono-ticket" style={{ fontWeight: 700, fontSize: "0.95rem", width: 22, textAlign: "center", color: "#2D1810" }}>{i.qty}</span>
                        <button onClick={() => addItem(i.id)} className="btn-press"
                          style={{ width: 26, height: 26, borderRadius: "50%", background: "#2D1810", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Plus size={10} color="#FFFFFF" />
                        </button>
                      </div>
                      <span style={{ fontWeight: 500, color: "#2D1810", fontSize: "0.9rem" }}>{i.name}</span>
                    </div>
                    <span className="font-mono-ticket" style={{ fontWeight: 700, color: "#B85C1E", fontSize: "0.9rem" }}>{money(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: "repeating-linear-gradient(90deg, rgba(212,160,74,0.3) 0, rgba(212,160,74,0.3) 6px, transparent 6px, transparent 12px)" }} />

              {/* Total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", fontWeight: 700, fontSize: "1.1rem" }}>
                <span style={{ color: "#2D1810" }}>TOTAL</span>
                <span className="font-mono-ticket" style={{ color: "#B85C1E", fontSize: "1.15rem" }}>{money(total)}</span>
              </div>

              <button onClick={() => { setTicketOpen(false); setStep("dados"); }} disabled={itemCount === 0} className="btn-press btn-hover"
                style={{
                  width: "100%", padding: "15px", borderRadius: 14, marginTop: 4,
                  background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                  color: "#FFF8F0", fontWeight: 700, fontSize: "1rem",
                  border: "none", cursor: itemCount === 0 ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 22px rgba(45,24,16,0.28)",
                  opacity: itemCount === 0 ? 0.4 : 1
                }}>
                Continuar para os dados →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

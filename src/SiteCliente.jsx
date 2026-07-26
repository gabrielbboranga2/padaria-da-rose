import React, { useState, useMemo, useEffect, useRef } from "react";
import { Wheat, Flame, Cookie, Plus, Minus, Phone, Clock, X, Check, ShoppingBag, AlertTriangle, Copy, Star, MapPin, Sparkles, Heart, Send, MessageCircle, User, LogIn } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const CATEGORIES = [
  { id: "paes", label: "Pães", icon: Wheat, gradient: "linear-gradient(135deg, #F59E0B, #F97316)" },
  { id: "domingo", label: "Domingo", icon: Flame, gradient: "linear-gradient(135deg, #EF4444, #EC4899)" },
  { id: "bolos", label: "Bolos & Doces", icon: Cookie, gradient: "linear-gradient(135deg, #8B5CF6, #D946EF)" },
];

const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function BreadDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)" }} />
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #F97316)", boxShadow: "0 0 8px rgba(245,158,11,0.5)" }} />
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)" }} />
    </div>
  );
}

function FloatingParticles() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: 4 + Math.random() * 6,
          height: 4 + Math.random() * 6,
          borderRadius: "50%",
          background: `rgba(245,158,11,${0.15 + Math.random() * 0.2})`,
          top: `${10 + Math.random() * 80}%`,
          left: `${5 + Math.random() * 90}%`,
          animation: `floatUp ${4 + Math.random() * 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`
        }} />
      ))}
    </div>
  );
}

const getCustomerData = () => {
  try {
    return JSON.parse(localStorage.getItem("padaria_customer") || "null");
  } catch { return null; }
};

const saveCustomerData = (data) => {
  localStorage.setItem("padaria_customer", JSON.stringify(data));
};

export default function SiteCliente() {
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState("paes");
  const [cart, setCart] = useState({});
  const [cartObs, setCartObs] = useState({});
  const [ticketOpen, setTicketOpen] = useState(false);
  const [step, setStep] = useState("menu");
  const [customer, setCustomer] = useState({ nome: "", telefone: "", retirada: "" });
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [localOrder, setLocalOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connectionOk, setConnectionOk] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const employeeSlug = useMemo(() => new URLSearchParams(window.location.search).get("func"), []);

  useEffect(() => {
    const saved = getCustomerData();
    if (saved) {
      setCustomer({ nome: saved.nome || "", telefone: saved.telefone || "", retirada: "" });
      setLoggedIn(true);
    }
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
        .map(([id, qty]) => {
          const prod = products.find((p) => p.id === id);
          return { ...prod, qty, obs: cartObs[id] || "" };
        }),
    [cart, products, cartObs]
  );

  const total = cartItems.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const addItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }));
  const updateObs = (id, text) => setCartObs((o) => ({ ...o, [id]: text }));

  const handleLoginSave = () => {
    if (customer.nome && customer.telefone) {
      saveCustomerData({ nome: customer.nome, telefone: customer.telefone });
      setLoggedIn(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("padaria_customer");
    setCustomer({ nome: "", telefone: "", retirada: "" });
    setLoggedIn(false);
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setStep("enviando");

    saveCustomerData({ nome: customer.nome, telefone: customer.telefone });

    const items = cartItems.map((i) => ({
      product_name: i.name,
      qty: i.qty,
      unit_price: i.price,
      observation: i.obs || "",
    }));

    const allNotes = cartItems.filter((i) => i.obs).map((i) => `${i.name}: ${i.obs}`).join("; ");

    const { data: orderResult, error } = await supabase.rpc("create_order", {
      p_customer_name: customer.nome,
      p_customer_phone: customer.telefone,
      p_pickup_time: customer.retirada,
      p_notes: allNotes || null,
      p_employee_slug: employeeSlug,
      p_total: total,
      p_items: items,
    });

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

    const orderId = Array.isArray(orderResult) ? orderResult[0]?.create_order?.id || orderResult[0]?.id : orderResult?.id || orderResult;
    setOrderNumber(orderId);
    setStep("enviado");
  };

  const copyOrderDetails = () => {
    if (!localOrder) return;
    const text = `PADARIA DA ROSE - Pedido #${localOrder.id}
${localOrder.customer.nome} - ${localOrder.customer.telefone}
Retirada: ${localOrder.customer.retirada}
${localOrder.items.map((i) => `${i.qty}x ${i.name}${i.obs ? ` (${i.obs})` : ""} - ${money(i.price * i.qty)}`).join("\n")}
TOTAL: ${money(localOrder.total)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#FFF8F0", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-mono-ticket { font-family: 'IBM Plex Mono', monospace; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.75); opacity:0; } 60% { transform: scale(1.06); } 100% { transform: scale(1); opacity:1; } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes floatUp { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; } 50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(245,158,11,0.3); } 50% { box-shadow: 0 0 40px rgba(245,158,11,0.5); } }
        @keyframes borderShine { 0% { border-color: rgba(245,158,11,0.2); } 50% { border-color: rgba(245,158,11,0.5); } 100% { border-color: rgba(245,158,11,0.2); } }
        @keyframes priceGlow { 0%, 100% { text-shadow: 0 0 4px rgba(220,38,38,0.3); } 50% { text-shadow: 0 0 12px rgba(220,38,38,0.5); } }

        .animate-fade-up { animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-fade-in { animation: fadeIn 0.4s ease both; }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-pulse-slow { animation: pulse 2.5s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-border-shine { animation: borderShine 3s ease-in-out infinite; }

        .card-hover { transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.35s ease; }
        .card-hover:hover { transform: translateY(-5px) scale(1.01); box-shadow: 0 24px 48px rgba(180,83,9,0.15) !important; border-color: rgba(245,158,11,0.3) !important; }
        .btn-press { transition: all 0.15s ease; }
        .btn-press:active { transform: scale(0.95); }
        .btn-hover:hover { filter: brightness(1.1); transform: translateY(-1px); }

        input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(245,158,11,0.2) !important; border-color: #F59E0B !important; }
        input::placeholder, textarea::placeholder { color: #C5B5A5; }

        .category-pill { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .category-pill:hover { transform: translateY(-2px); }
        .category-pill.active { transform: scale(1.05); }

        .gradient-text {
          background: linear-gradient(135deg, #F59E0B, #EF4444, #F59E0B);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .hero-pattern {
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(245,158,11,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239,68,68,0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 60%);
        }
      `}</style>

      {/* HEADER */}
      <header style={{ 
        background: "linear-gradient(160deg, #1C0A00 0%, #3D1C0A 35%, #5C2E0E 65%, #7A3B12 100%)", 
        position: "relative", 
        overflow: "hidden" 
      }}>
        <FloatingParticles />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-50%", left: "-15%", width: "70%", height: "180%", background: "radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "55%", height: "140%", background: "radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6), rgba(239,68,68,0.4), transparent)" }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-14 pb-20 flex flex-col items-center text-center relative" style={{ zIndex: 1 }}>
          <div className="mb-6 animate-fade-up" style={{ animationDelay: "0s" }}>
            <div style={{
              width: 130, height: 130,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: "0 0 0 3px rgba(245,158,11,0.4), 0 0 40px rgba(245,158,11,0.2), 0 16px 48px rgba(0,0,0,0.5)",
              position: "relative",
              animation: "glow 3s ease-in-out infinite"
            }}>
              <img src="/logo.png" alt="Padaria da Rose" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>

          <h1 className="font-display animate-fade-up" style={{
            fontSize: "clamp(2.5rem, 7vw, 4.2rem)", fontWeight: 800, color: "#FFF8F0",
            letterSpacing: "-0.03em", lineHeight: 1.05, animationDelay: "0.08s",
            textShadow: "0 2px 20px rgba(0,0,0,0.3)"
          }}>
            Padaria <span className="gradient-text">da Rose</span>
          </h1>

          <div className="flex items-center gap-4 my-5 animate-fade-up" style={{ animationDelay: "0.14s" }}>
            <div style={{ height: 2, width: 52, background: "linear-gradient(90deg, transparent, #F59E0B)" }} />
            <Sparkles size={18} color="#F59E0B" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.5))" }} />
            <div style={{ height: 2, width: 52, background: "linear-gradient(90deg, #F59E0B, transparent)" }} />
          </div>

          <p className="animate-fade-up" style={{
            color: "#D4B896", fontSize: "1.1rem", maxWidth: 420, lineHeight: 1.7,
            animationDelay: "0.18s", fontWeight: 300
          }}>
            Pães artesanais, bolos e doces feitos com amor.<br />
            <span style={{ color: "#A08068", fontSize: "0.95rem", fontWeight: 400 }}>Encomende direto pelo celular e retire na padaria.</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-7 animate-fade-up" style={{ animationDelay: "0.22s" }}>
            <a href="tel:+5518991914512" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 100,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#F5D89A", fontSize: "0.88rem", textDecoration: "none", transition: "all 0.25s",
              backdropFilter: "blur(8px)"
            }}>
              <Phone size={14} color="#F59E0B" /> (18) 99191-4512
            </a>
            <span style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 100,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              color: "#F5B8A8", fontSize: "0.88rem"
            }}>
              <Clock size={14} color="#EF4444" /> Seg–Sáb, 5h–19h | Dom, 5h–13h
            </span>
          </div>
        </div>

        <div style={{
          height: 56, background: "#FFF8F0",
          clipPath: "ellipse(62% 100% at 50% 100%)", marginTop: -1
        }} />
      </header>

      {/* OFFLINE BANNER */}
      {!connectionOk && (
        <div className="max-w-5xl mx-auto px-5 pt-4">
          <div className="rounded-2xl p-4 flex items-start gap-3 animate-fade-up" style={{ 
            background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", 
            border: "1px solid #F59E0B", boxShadow: "0 4px 20px rgba(245,158,11,0.2)"
          }}>
            <AlertTriangle size={18} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#78350F" }}>
              <strong style={{ color: "#92400E" }}>Sistema offline.</strong> Seu pedido será salvo localmente. Ao finalizar, encaminhe os detalhes para a padaria.
            </p>
          </div>
        </div>
      )}

      {/* MENU */}
      {step === "menu" && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-32 animate-fade-up">
          <nav className="flex gap-3 overflow-x-auto py-6 sticky top-0 z-20" style={{
            background: "rgba(255,248,240,0.95)", backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(245,158,11,0.12)", scrollbarWidth: "none"
          }}>
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className="category-pill flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap"
                  style={{
                    background: isActive ? c.gradient : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : "#5C3D2E",
                    border: isActive ? "none" : "1.5px solid rgba(245,158,11,0.18)",
                    boxShadow: isActive 
                      ? `0 8px 24px rgba(245,158,11,0.35), 0 0 0 1px rgba(255,255,255,0.2) inset` 
                      : "0 2px 8px rgba(0,0,0,0.06)"
                  }}>
                  <Icon size={16} /> {c.label}
                  {isActive && <Sparkles size={12} style={{ marginLeft: 2 }} />}
                </button>
              );
            })}
          </nav>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <Wheat size={42} color="#F59E0B" className="animate-pulse-slow" style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.4))" }} />
              <span style={{ color: "#8A7A6A", fontSize: "0.95rem", fontWeight: 500 }}>Carregando cardápio…</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {products.filter((p) => p.category === activeCat).map((p, idx) => (
                <div key={p.id} className="card-hover rounded-2xl overflow-hidden"
                  style={{
                    background: "#FFFFFF", border: "1.5px solid rgba(245,158,11,0.12)",
                    boxShadow: "0 4px 20px rgba(120,53,15,0.07)",
                    opacity: p.available ? 1 : 0.5,
                    animation: `fadeUp 0.45s ease-out ${idx * 0.08}s both`
                  }}>
                  <div style={{
                    height: 4,
                    background: p.available ? "linear-gradient(90deg, #F59E0B, #EF4444, #F59E0B)" : "#E8E0D8"
                  }} />
                  <div style={{ padding: "22px 22px 20px" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div style={{ flex: 1 }}>
                        <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1C0A00", lineHeight: 1.2 }}>{p.name}</h3>
                        {p.description && (
                          <p style={{ fontSize: "0.84rem", color: "#7A6B5D", marginTop: 6, lineHeight: 1.55 }}>{p.description}</p>
                        )}
                      </div>
                      {!p.available && (
                        <span style={{
                          fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em",
                          padding: "4px 12px", borderRadius: 100,
                          background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(236,72,153,0.08))", color: "#DC2626",
                          border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0,
                          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600
                        }}>Esgotado</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1.5px dashed rgba(245,158,11,0.15)" }}>
                      <div>
                        <span className="font-mono-ticket" style={{ 
                          fontSize: "1.3rem", fontWeight: 700, color: "#DC2626",
                          animation: "priceGlow 3s ease-in-out infinite"
                        }}>
                          {money(p.price)}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#9A8A7A", marginLeft: 4 }}>/ {p.unit}</span>
                      </div>
                      {p.available ? (
                        (cart[p.id] || 0) > 0 ? (
                          <div className="flex items-center gap-3">
                            <button onClick={() => removeItem(p.id)} className="btn-press"
                              style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: "#FEF3C7", border: "1.5px solid rgba(245,158,11,0.3)",
                                color: "#92400E", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "all 0.2s"
                              }}>
                              <Minus size={14} />
                            </button>
                            <span className="font-mono-ticket" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1C0A00", width: 28, textAlign: "center" }}>{cart[p.id]}</span>
                            <button onClick={() => addItem(p.id)} className="btn-press"
                              style={{
                                width: 36, height: 36, borderRadius: "50%",
                                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                                color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 14px rgba(245,158,11,0.4)", cursor: "pointer", border: "none"
                              }}>
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addItem(p.id)} className="btn-press btn-hover"
                            style={{
                              fontSize: "0.85rem", fontWeight: 700,
                              padding: "10px 20px", borderRadius: 100,
                              background: "linear-gradient(135deg, #1C0A00, #3D1C0A)",
                              color: "#F5D89A", border: "none",
                              boxShadow: "0 4px 16px rgba(28,10,0,0.28)",
                              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                              transition: "all 0.25s"
                            }}>
                            <Plus size={14} /> Adicionar
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#9A8A7A", padding: "7px 14px", background: "rgba(154,138,122,0.08)", borderRadius: 100, fontWeight: 500 }}>
                          Em breve
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {products.filter((p) => p.category === activeCat).length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-20">
                  <div style={{ 
                    width: 80, height: 80, borderRadius: "50%", 
                    background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.08))", 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    margin: "0 auto 18px", boxShadow: "0 0 30px rgba(245,158,11,0.15)"
                  }}>
                    <Cookie size={34} color="#F59E0B" />
                  </div>
                  <p className="font-display" style={{ color: "#1C0A00", fontSize: "1.15rem", fontWeight: 600 }}>Nenhum produto nesta categoria.</p>
                  <p style={{ color: "#9A8A7A", fontSize: "0.88rem", marginTop: 8 }}>Volte em breve para conferir as novidades!</p>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* DADOS */}
      {step === "dados" && (
        <main className="max-w-lg mx-auto px-5 py-12 animate-fade-up">
          <button onClick={() => setStep("menu")}
            className="btn-press flex items-center gap-2.5 mb-8 group"
            style={{ background: "none", border: "none", color: "#5C3D2E", cursor: "pointer", fontSize: "0.92rem", fontWeight: 600 }}>
            <span style={{
              width: 36, height: 36, borderRadius: "50%", 
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "transform 0.2s", fontSize: "1.1rem"
            }}>←</span>
            Voltar ao cardápio
          </button>

          <div style={{
            background: "#FFFFFF", borderRadius: 24,
            border: "1.5px solid rgba(245,158,11,0.15)",
            boxShadow: "0 12px 48px rgba(120,53,15,0.1), 0 0 0 1px rgba(245,158,11,0.05)",
            overflow: "hidden"
          }}>
            <div style={{ 
              padding: "32px 32px 0",
              background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.03))",
              borderBottom: "1px solid rgba(245,158,11,0.08)"
            }}>
              <h2 className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "#1C0A00", marginBottom: 6 }}>Seus dados</h2>
              <p style={{ fontSize: "0.9rem", color: "#7A6B5D", marginBottom: 28 }}>Para o padeiro saber quem retira e quando.</p>
            </div>

            <form onSubmit={submitOrder} style={{ padding: "28px 32px 32px" }}>
              {/* Login info */}
              {loggedIn && (
                <div style={{ 
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 12, marginBottom: 20,
                  background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))",
                  border: "1px solid rgba(16,185,129,0.2)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={14} color="#10B981" />
                    <span style={{ fontSize: "0.82rem", color: "#065F46", fontWeight: 500 }}>Dados preenchidos automaticamente</span>
                  </div>
                  <button type="button" onClick={handleLogout}
                    style={{ fontSize: "0.75rem", color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Trocar
                  </button>
                </div>
              )}

              {[
                { label: "Nome completo", key: "nome", placeholder: "Seu nome completo", type: "text", icon: "👤" },
                { label: "Telefone", key: "telefone", placeholder: "(18) 9XXXX-XXXX", type: "tel", icon: "📱" },
                { label: "Horário de retirada", key: "retirada", placeholder: "Ex: hoje às 17h", type: "text", icon: "⏰" },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#78350F", marginBottom: 8 }}>
                    {field.icon} {field.label}
                  </label>
                  <input
                    required
                    type={field.type}
                    value={customer[field.key]}
                    onChange={(e) => setCustomer({ ...customer, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "14px 18px", borderRadius: 14,
                      border: "1.5px solid rgba(245,158,11,0.2)",
                      background: "#FFFBF5", color: "#1C0A00", fontSize: "0.95rem",
                      transition: "all 0.25s", boxSizing: "border-box"
                    }}
                  />
                </div>
              ))}

              {!loggedIn && customer.nome && customer.telefone && (
                <button type="button" onClick={handleLoginSave}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12, marginBottom: 20,
                    background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
                    border: "1px solid rgba(99,102,241,0.2)", color: "#4338CA",
                    fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}>
                  <LogIn size={14} /> Salvar meus dados para próxima compra
                </button>
              )}

              {/* Per-product observations */}
              {cartItems.some((i) => i.has_obs) && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#78350F", marginBottom: 12 }}>
                    💬 Observações por produto
                  </p>
                  {cartItems.filter((i) => i.has_obs).map((i) => (
                    <div key={i.id} style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#5C3D2E", marginBottom: 6 }}>
                        {i.qty}x {i.name} — <span style={{ color: "#9A8A7A", fontWeight: 400 }}>{i.obs_label || "Observação"}</span>
                      </label>
                      <input
                        type="text"
                        value={cartObs[i.id] || ""}
                        onChange={(e) => updateObs(i.id, e.target.value)}
                        placeholder={i.obs_label || "Ex: sem sal, bem passado..."}
                        style={{
                          width: "100%", padding: "12px 16px", borderRadius: 12,
                          border: "1.5px solid rgba(245,158,11,0.2)",
                          background: "#FFFBF5", color: "#1C0A00", fontSize: "0.9rem",
                          transition: "all 0.25s", boxSizing: "border-box"
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Order summary */}
              <div style={{
                background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                border: "1.5px solid rgba(245,158,11,0.25)",
                borderRadius: 16, padding: "18px 20px", marginBottom: 24,
                boxShadow: "0 4px 16px rgba(245,158,11,0.12)"
              }}>
                <p style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#78350F", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShoppingBag size={14} color="#F59E0B" /> Resumo do pedido
                </p>
                {cartItems.map((i) => (
                  <div key={i.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#78350F", padding: "3px 0" }}>
                      <span>{i.qty}x {i.name}</span>
                      <span className="font-mono-ticket" style={{ fontWeight: 600 }}>{money(i.price * i.qty)}</span>
                    </div>
                    {i.obs && (
                      <p style={{ fontSize: "0.78rem", color: "#9A8A7A", fontStyle: "italic", paddingLeft: 8 }}>
                        → {i.obs}
                      </p>
                    )}
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px dashed rgba(245,158,11,0.3)", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", color: "#1C0A00" }}>
                  <span>TOTAL</span>
                  <span className="font-mono-ticket" style={{ color: "#DC2626" }}>{money(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={itemCount === 0 || step === "enviando"} className="btn-press btn-hover"
                style={{
                  width: "100%", padding: "16px", borderRadius: 16,
                  background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)",
                  color: "#FFFFFF", fontWeight: 800, fontSize: "1.05rem",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 8px 28px rgba(245,158,11,0.35)",
                  opacity: itemCount === 0 ? 0.4 : 1, letterSpacing: "0.02em"
                }}>
                {step === "enviando" ? "Enviando..." : "✨ Confirmar encomenda ✨"}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ENVIANDO */}
      {step === "enviando" && (
        <main className="max-w-md mx-auto px-6 py-24 text-center animate-fade-in">
          <Wheat size={42} color="#F59E0B" style={{ margin: "0 auto 18px", filter: "drop-shadow(0 0 8px rgba(245,158,11,0.4))" }} className="animate-pulse-slow" />
          <p className="font-display" style={{ fontSize: "1.4rem", color: "#1C0A00", fontWeight: 600 }}>Enviando sua encomenda…</p>
        </main>
      )}

      {/* ENVIADO */}
      {step === "enviado" && (
        <main className="max-w-lg mx-auto px-5 py-20 text-center animate-fade-up">
          <div className="animate-pop-in" style={{
            width: 90, height: 90, borderRadius: "50%", margin: "0 auto 30px",
            background: "linear-gradient(135deg, #10B981, #059669)",
            boxShadow: "0 0 40px rgba(16,185,129,0.35), 0 12px 36px rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Check size={42} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h2 className="font-display" style={{ fontSize: "2.2rem", fontWeight: 800, color: "#1C0A00", marginBottom: 14 }}>Pedido confirmado!</h2>
          <p style={{ fontSize: "1.05rem", color: "#7A6B5D", lineHeight: 1.7 }}>
            A comanda nº <b className="font-mono-ticket" style={{ fontSize: "1.15rem", color: "#DC2626" }}>#{orderNumber}</b> já chegou na padaria.
          </p>
          <p style={{ fontSize: "0.9rem", color: "#9A8A7A", marginTop: 10 }}>A Rose vai confirmar com você em breve pelo telefone.</p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <a href="tel:+5518991914512" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 26px", borderRadius: 16,
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", 
              border: "1.5px solid rgba(245,158,11,0.3)",
              color: "#78350F", textDecoration: "none", fontSize: "0.92rem", transition: "all 0.25s", fontWeight: 600
            }}>
              <Phone size={16} color="#F59E0B" />
              Precisa falar? <strong>(18) 99191-4512</strong>
            </a>
            {employeeSlug && (
              <ChatCliente orderNumber={orderNumber} employeeSlug={employeeSlug} customerName={customer.nome} />
            )}
            <button onClick={() => { setCart({}); setCartObs({}); setCustomer({ nome: "", telefone: "", retirada: "" }); setStep("menu"); }}
              className="btn-press"
              style={{
                padding: "14px 36px", borderRadius: 100,
                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                color: "#FFFFFF", fontWeight: 700, fontSize: "0.92rem", border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(245,158,11,0.35)"
              }}>
              Fazer outra encomenda
            </button>
          </div>
        </main>
      )}

      {/* FALLBACK */}
      {step === "fallback" && localOrder && (
        <main className="max-w-md mx-auto px-5 py-10 animate-fade-up">
          <div style={{ 
            borderRadius: 20, padding: "18px 22px", marginBottom: 22, 
            background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", 
            border: "1.5px solid #F59E0B", textAlign: "center",
            boxShadow: "0 4px 20px rgba(245,158,11,0.2)"
          }}>
            <AlertTriangle size={24} color="#B45309" style={{ margin: "0 auto 10px" }} />
            <h3 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#92400E", marginBottom: 6 }}>Sistema temporariamente offline</h3>
            <p style={{ fontSize: "0.88rem", color: "#78350F", lineHeight: 1.6 }}>
              Não foi possível conectar automaticamente. Copie ou anote os dados e nos envie pelo WhatsApp.
            </p>
          </div>

          <div className="font-mono-ticket" style={{ 
            background: "#FFFFFF", borderRadius: 20, padding: "24px 26px", 
            border: "1.5px solid rgba(245,158,11,0.2)", 
            boxShadow: "0 8px 32px rgba(120,53,15,0.08)" 
          }}>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "#1C0A00" }}>PADARIA DA ROSE</p>
            <p style={{ color: "#5C3D2E", marginTop: 2 }}>Pedido #{localOrder.id}</p>
            <p style={{ fontSize: "0.8rem", color: "#7A6B5D" }}>{localOrder.created_at}</p>
            <BreadDivider />
            <p style={{ color: "#1C0A00", fontWeight: 600 }}>{localOrder.customer.nome}</p>
            <p style={{ color: "#5C3D2E" }}>{localOrder.customer.telefone}</p>
            <p style={{ color: "#5C3D2E" }}>Retirada: {localOrder.customer.retirada}</p>
            <BreadDivider />
            {localOrder.items.map((i, idx) => (
              <div key={idx} style={{ padding: "5px 0", color: "#1C0A00" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{i.qty}x {i.name}</span>
                  <span>{money(i.price * i.qty)}</span>
                </div>
                {i.obs && <p style={{ fontSize: "0.78rem", color: "#9A8A7A", fontStyle: "italic", paddingLeft: 8 }}>→ {i.obs}</p>}
              </div>
            ))}
            <BreadDivider />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem", color: "#1C0A00" }}>
              <span>TOTAL</span>
              <span>{money(localOrder.total)}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
            <a href="https://wa.me/5518991914512" target="_blank" rel="noopener noreferrer"
              style={{
                width: "100%", padding: "15px", borderRadius: 16,
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                color: "#FFFFFF", fontWeight: 700, textAlign: "center",
                display: "block", textDecoration: "none", 
                boxShadow: "0 6px 20px rgba(37,211,102,0.3)"
              }}>
              📲 Enviar pelo WhatsApp
            </a>
            <button onClick={copyOrderDetails} className="btn-press"
              style={{
                width: "100%", padding: "13px", borderRadius: 16,
                background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", 
                color: "#78350F", fontWeight: 600,
                border: "1.5px solid rgba(245,158,11,0.3)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
              {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar pedido</>}
            </button>
            <button onClick={() => { setStep("menu"); setOrderError(null); }}
              style={{ width: "100%", padding: "11px", borderRadius: 16, background: "none", color: "#7A6B5D", fontSize: "0.9rem", border: "none", cursor: "pointer", fontWeight: 500 }}>
              Tentar novamente
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#7A6B5D", marginTop: 22 }}>
            Ou ligue: <strong style={{ color: "#1C0A00" }}>(18) 99191-4512</strong>
          </p>
        </main>
      )}

      {/* FLOATING CART BUTTON */}
      {step === "menu" && itemCount > 0 && (
        <button onClick={() => setTicketOpen(true)} className="animate-slide-up btn-press"
          style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 18,
            padding: "16px 30px", borderRadius: 100,
            background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)",
            color: "#FFFFFF", border: "none", cursor: "pointer",
            boxShadow: "0 12px 40px rgba(245,158,11,0.45), 0 0 0 2px rgba(255,255,255,0.3) inset",
            zIndex: 30, whiteSpace: "nowrap",
            animation: "glow 3s ease-in-out infinite"
          }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: "50%", 
            background: "rgba(255,255,255,0.25)", 
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 12px rgba(255,255,255,0.2)"
          }}>
            <ShoppingBag size={17} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
          <span style={{ width: 1.5, height: 24, background: "rgba(255,255,255,0.35)" }} />
          <span className="font-mono-ticket" style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "1.05rem" }}>{money(total)}</span>
        </button>
      )}

      {/* CART MODAL */}
      {ticketOpen && (
        <div className="animate-fade-in" style={{
          position: "fixed", inset: 0, zIndex: 40,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          background: "rgba(28,10,0,0.75)"
        }} onClick={(e) => { if (e.target === e.currentTarget) setTicketOpen(false); }}>
          <div className="animate-slide-up" style={{
            width: "100%", maxWidth: 460, maxHeight: "88vh",
            overflowY: "auto", borderRadius: "28px 28px 0 0",
            background: "#FFFFFF",
            boxShadow: "0 -16px 56px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
              <div style={{ width: 44, height: 5, borderRadius: 3, background: "linear-gradient(90deg, #F5D89A, #F59E0B)" }} />
            </div>

            <div style={{ padding: "14px 26px 30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ 
                    width: 46, height: 46, borderRadius: "50%", 
                    background: "linear-gradient(135deg, #F59E0B, #F97316)", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(245,158,11,0.35)"
                  }}>
                    <ShoppingBag size={20} color="#FFFFFF" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: "#1C0A00", fontSize: "1.05rem" }}>Seu Pedido</p>
                    <p style={{ fontSize: "0.78rem", color: "#9A8A7A" }}>{new Date().toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <button onClick={() => setTicketOpen(false)} className="btn-press"
                  style={{ 
                    width: 40, height: 40, borderRadius: "50%", 
                    background: "#FEF3C7", border: "1.5px solid rgba(245,158,11,0.2)", 
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" 
                  }}>
                  <X size={16} color="#92400E" />
                </button>
              </div>

              <div style={{ height: 1.5, background: "repeating-linear-gradient(90deg, rgba(245,158,11,0.35) 0, rgba(245,158,11,0.35) 6px, transparent 6px, transparent 12px)" }} />

              <div style={{ padding: "18px 0", display: "flex", flexDirection: "column", gap: 8 }}>
                {cartItems.length === 0 && (
                  <div style={{ textAlign: "center", padding: "36px 0" }}>
                    <ShoppingBag size={34} color="#F59E0B" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                    <p style={{ color: "#9A8A7A", fontSize: "0.92rem" }}>Sua comanda está vazia.</p>
                  </div>
                )}
                {cartItems.map((i) => (
                  <div key={i.id} style={{ padding: "10px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <button onClick={() => removeItem(i.id)} className="btn-press"
                            style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEF3C7", border: "1.5px solid rgba(245,158,11,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Minus size={11} color="#92400E" />
                          </button>
                          <span className="font-mono-ticket" style={{ fontWeight: 700, fontSize: "1rem", width: 24, textAlign: "center", color: "#1C0A00" }}>{i.qty}</span>
                          <button onClick={() => addItem(i.id)} className="btn-press"
                            style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #F97316)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={11} color="#FFFFFF" />
                          </button>
                        </div>
                        <span style={{ fontWeight: 600, color: "#1C0A00", fontSize: "0.92rem" }}>{i.name}</span>
                      </div>
                      <span className="font-mono-ticket" style={{ fontWeight: 700, color: "#DC2626", fontSize: "0.92rem" }}>{money(i.price * i.qty)}</span>
                    </div>
                    {i.has_obs && (cart[i.id] || 0) > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 47 }}>
                        <input
                          type="text"
                          value={cartObs[i.id] || ""}
                          onChange={(e) => updateObs(i.id, e.target.value)}
                          placeholder={i.obs_label || "Observação..."}
                          style={{
                            width: "100%", padding: "10px 14px", borderRadius: 10,
                            border: "1.5px solid rgba(245,158,11,0.2)",
                            background: "#FFFBF5", color: "#1C0A00", fontSize: "0.85rem",
                            transition: "all 0.25s", boxSizing: "border-box"
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ height: 1.5, background: "repeating-linear-gradient(90deg, rgba(245,158,11,0.35) 0, rgba(245,158,11,0.35) 6px, transparent 6px, transparent 12px)" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", fontWeight: 800, fontSize: "1.15rem" }}>
                <span style={{ color: "#1C0A00" }}>TOTAL</span>
                <span className="font-mono-ticket" style={{ color: "#DC2626", fontSize: "1.2rem" }}>{money(total)}</span>
              </div>

              <button onClick={() => { setTicketOpen(false); setStep("dados"); }} disabled={itemCount === 0} className="btn-press btn-hover"
                style={{
                  width: "100%", padding: "16px", borderRadius: 16, marginTop: 6,
                  background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)",
                  color: "#FFFFFF", fontWeight: 800, fontSize: "1.05rem",
                  border: "none", cursor: itemCount === 0 ? "not-allowed" : "pointer",
                  boxShadow: "0 8px 28px rgba(245,158,11,0.35)",
                  opacity: itemCount === 0 ? 0.4 : 1
                }}>
                ✨ Continuar para os dados →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT CLIENTE ↔ VENDEDOR
   ═══════════════════════════════════════════════ */
function ChatCliente({ orderNumber, employeeSlug, customerName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [open, employeeSlug]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("employee_slug", employeeSlug)
      .order("created_at", { ascending: true })
      .limit(50);
    if (data) setMessages(data);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      order_id: orderNumber,
      employee_slug: employeeSlug,
      sender: "customer",
      sender_name: customerName || "Cliente",
      message: newMsg.trim(),
    });
    setNewMsg("");
    setSending(false);
    loadMessages();
  };

  return (
    <div style={{ width: "100%" }}>
      <button onClick={() => setOpen(!open)}
        className="btn-press"
        style={{
          width: "100%", padding: "14px 26px", borderRadius: 16,
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          color: "#FFFFFF", fontWeight: 700, fontSize: "0.92rem",
          border: "none", cursor: "pointer",
          boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10
        }}>
        <MessageCircle size={18} />
        {open ? "Fechar chat" : "Conversar com o vendedor"}
      </button>

      {open && (
        <div className="animate-slide-up" style={{
          marginTop: 14, borderRadius: 20, overflow: "hidden",
          border: "1.5px solid rgba(99,102,241,0.2)",
          boxShadow: "0 8px 32px rgba(99,102,241,0.15)",
          background: "#FFFFFF"
        }}>
          {/* Chat header */}
          <div style={{
            padding: "14px 18px",
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#FFFFFF", fontWeight: 700, fontSize: "0.92rem",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <User size={16} />
            </div>
            <div>
              <p style={{ fontWeight: 700 }}>{employeeSlug}</p>
              <p style={{ fontSize: "0.72rem", opacity: 0.8 }}>Vendedor online</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ 
            maxHeight: 300, overflowY: "auto", padding: "14px 16px",
            display: "flex", flexDirection: "column", gap: 10,
            background: "#F8F7FF"
          }}>
            {messages.length === 0 && (
              <p style={{ textAlign: "center", color: "#9A8A7A", fontSize: "0.85rem", padding: 20 }}>
                Envie uma mensagem para o vendedor...
              </p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: msg.sender === "customer" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 16,
                  background: msg.sender === "customer" 
                    ? "linear-gradient(135deg, #6366F1, #8B5CF6)" 
                    : "#FFFFFF",
                  color: msg.sender === "customer" ? "#FFFFFF" : "#1C0A00",
                  border: msg.sender === "customer" ? "none" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                  <p style={{ fontWeight: 600, fontSize: "0.78rem", marginBottom: 4, opacity: 0.7 }}>
                    {msg.sender_name}
                  </p>
                  <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{msg.message}</p>
                  <p style={{ fontSize: "0.68rem", marginTop: 4, opacity: 0.5 }}>
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ 
            padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex", gap: 8, background: "#FFFFFF"
          }}>
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Digite sua mensagem..."
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 12,
                border: "1.5px solid rgba(99,102,241,0.2)",
                background: "#F8F7FF", color: "#1C0A00", fontSize: "0.9rem",
                outline: "none"
              }}
            />
            <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: sending || !newMsg.trim() ? 0.5 : 1
              }}>
              <Send size={16} color="#FFFFFF" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

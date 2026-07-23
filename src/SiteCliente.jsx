import React, { useState, useMemo, useEffect } from "react";
import { Wheat, Flame, Cookie, Plus, Minus, Phone, Clock, X, Check, ShoppingBag, AlertTriangle, Copy } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const CATEGORIES = [
  { id: "paes", label: "Pães", icon: Wheat },
  { id: "domingo", label: "Domingo", icon: Flame },
  { id: "bolos", label: "Bolos & Doces", icon: Cookie },
];

const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Logo() {
  return (
    <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden" style={{
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      border: "3px solid rgba(232, 195, 106, 0.6)"
    }}>
      <img
        src="/logo.png"
        alt="Padaria da Rose"
        className="w-full h-full object-cover"
        style={{
          mixBlendMode: "multiply",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        }}
      />
    </div>
  );
}

function BreadDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #D4A04A66, transparent)" }} />
      <Wheat size={16} color="#D4A04A" strokeWidth={1.5} />
      <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, #D4A04A66, transparent)" }} />
    </div>
  );
}

const DECORATIVE_BREADS = [
  "M20 55 Q20 30 50 25 Q80 30 80 55 Z",
  "M30 50 Q30 20 50 18 Q70 20 70 50 Z",
  "M15 52 Q15 40 50 35 Q85 40 85 52 Z",
];

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
    await supabase.from("order_items").insert(items);

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
    <div className="min-h-screen w-full relative" style={{ background: "#FCF6F0", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-ticket { font-family: 'IBM Plex Mono', monospace; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { transform: scale(0); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
        .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-pulse-slow { animation: pulse 2.5s ease-in-out infinite; }
        .animate-float { animation: float 5s ease-in-out infinite; }
        
        .card-hover { 
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .card-hover:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 16px 40px rgba(93, 60, 46, 0.12); 
        }
        .btn-press:active { transform: scale(0.97); }
        
        input::placeholder, textarea::placeholder {
          color: #B8A898;
        }
      `}</style>

      <header className="relative overflow-hidden" style={{
        background: "linear-gradient(180deg, #1a0f0a 0%, #2D1810 50%, #3d2215 100%)"
      }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(circle at 30% 40%, rgba(232, 195, 106, 0.08) 0%, transparent 60%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(circle at 70% 60%, rgba(232, 195, 106, 0.05) 0%, transparent 50%)"
          }} />
          {DECORATIVE_BREADS.map((d, i) => (
            <svg key={i} className="absolute opacity-[0.03]" style={{
              width: 200 + i * 80, height: 120 + i * 40,
              bottom: -20 + i * 20, [i % 2 === 0 ? "left" : "right"]: -30 + i * 40
            }} viewBox="0 0 100 60" fill="#E8C36A">
              <path d={d} />
            </svg>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-10 pb-14 flex flex-col items-center text-center relative z-10">
          <div className="mb-6">
            <Logo />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight" style={{ color: "#FFF8F0" }}>
            Padaria <span style={{ color: "#E8C36A" }}>da Rose</span>
          </h1>
          <div className="flex items-center gap-3 my-4" style={{ color: "#E8C36A" }}>
            <span className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, #E8C36A)" }} />
            <Wheat size={18} strokeWidth={1.5} />
            <span className="h-px w-12" style={{ background: "linear-gradient(90deg, #E8C36A, transparent)" }} />
          </div>
          <p className="max-w-lg text-base sm:text-lg leading-relaxed" style={{ color: "#C4A98E" }}>
            Pães artesanais, bolos, doces e assados feitos com carinho.
            <br />
            <span className="text-sm" style={{ color: "#A0896E" }}>Encomende agora e retire na padaria.</span>
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm" style={{ color: "#C4A98E" }}>
            <a href="tel:+5518991914512" className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105" style={{
              background: "rgba(232, 195, 106, 0.1)",
              border: "1px solid rgba(232, 195, 106, 0.2)"
            }}>
              <Phone size={14} color="#E8C36A" />
              <span>(18) 99191-4512</span>
            </a>
            <span className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
              background: "rgba(232, 195, 106, 0.1)",
              border: "1px solid rgba(232, 195, 106, 0.2)"
            }}>
              <Clock size={14} color="#E8C36A" />
              <span>Ter–Dom, 6h–19h</span>
            </span>
          </div>
        </div>

        <div style={{
          height: 40,
          background: "linear-gradient(180deg, transparent, #FCF6F0)",
          clipPath: "ellipse(80% 100% at 50% 100%)",
          marginTop: -20,
          position: "relative",
          zIndex: 2
        }} />
      </header>

      {!connectionOk && (
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <div className="rounded-xl p-4 flex items-start gap-3 animate-fade-in" style={{ background: "#FFF3E0", border: "1px solid #FFCC80" }}>
            <AlertTriangle size={18} color="#E65100" className="mt-0.5 shrink-0" />
            <div className="text-sm" style={{ color: "#5C3D2E" }}>
              <strong style={{ color: "#BF360C" }}>Sistema offline.</strong> Seu pedido será salvo localmente. Ao finalizar, encaminhe os detalhes para a padaria.
            </div>
          </div>
        </div>
      )}

      {step === "menu" && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-32 animate-fade-in">
          <nav className="flex gap-3 overflow-x-auto py-6 sticky top-0 z-20 backdrop-blur-md" style={{ 
            background: "rgba(252, 246, 240, 0.95)",
            borderBottom: "1px solid rgba(212, 160, 74, 0.1)"
          }}>
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = activeCat === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all btn-press"
                  style={{
                    background: isActive ? "linear-gradient(135deg, #2D1810, #4A2C1A)" : "#FFFFFF",
                    color: isActive ? "#FCF6F0" : "#5C3D2E",
                    border: "1px solid",
                    borderColor: isActive ? "transparent" : "rgba(212, 160, 74, 0.15)",
                    boxShadow: isActive ? "0 4px 16px rgba(45, 24, 16, 0.25)" : "0 2px 8px rgba(0,0,0,0.04)"
                  }}>
                  <Icon size={16} />{c.label}
                </button>
              );
            })}
          </nav>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <Wheat size={40} color="#D4A04A" className="animate-pulse-slow" />
              </div>
              <span className="text-sm font-medium" style={{ color: "#7A6B5D" }}>Carregando cardápio…</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {products.filter((p) => p.category === activeCat).map((p, idx) => (
                <div key={p.id} className="rounded-2xl overflow-hidden card-hover group"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(212, 160, 74, 0.12)",
                    boxShadow: "0 4px 16px rgba(93, 60, 46, 0.06)",
                    opacity: p.available ? 1 : 0.55,
                    animation: `fadeIn 0.4s ease-out ${idx * 0.08}s both`
                  }}>
                  <div className="h-2" style={{
                    background: p.available 
                      ? "linear-gradient(90deg, #D4A04A, #E8C36A, #D4A04A)" 
                      : "#E0D5C9"
                  }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-semibold" style={{ color: "#2D1810" }}>{p.name}</h3>
                        <p className="text-sm mt-2 leading-relaxed" style={{ color: "#7A6B5D" }}>{p.description}</p>
                      </div>
                      {!p.available && (
                        <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono-ticket shrink-0 font-medium" style={{ 
                          background: "rgba(184, 74, 74, 0.08)", 
                          color: "#B84A4A",
                          border: "1px solid rgba(184, 74, 74, 0.15)"
                        }}>
                          Esgotado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid rgba(212, 160, 74, 0.12)" }}>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono-ticket text-xl font-bold" style={{ color: "#B85C1E" }}>
                          {money(p.price)}
                        </span>
                        <span className="text-xs font-medium" style={{ color: "#9A8A7A" }}>/ {p.unit}</span>
                      </div>
                      {p.available ? (
                        (cart[p.id] || 0) > 0 ? (
                          <div className="flex items-center gap-3">
                            <button onClick={() => removeItem(p.id)}
                              className="w-9 h-9 rounded-full flex items-center justify-center btn-press transition-all"
                              style={{ 
                                background: "#F5E6D3", 
                                color: "#5C3D2E",
                                border: "1px solid rgba(212, 160, 74, 0.2)"
                              }}>
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-mono-ticket text-lg font-bold" style={{ color: "#2D1810" }}>{cart[p.id]}</span>
                            <button onClick={() => addItem(p.id)}
                              className="w-9 h-9 rounded-full flex items-center justify-center btn-press transition-all"
                              style={{ 
                                background: "linear-gradient(135deg, #D4A04A, #C9953E)", 
                                color: "#FFFFFF",
                                boxShadow: "0 2px 8px rgba(212, 160, 74, 0.3)"
                              }}>
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addItem(p.id)}
                            className="text-sm font-medium px-5 py-2.5 rounded-full flex items-center gap-2 btn-press transition-all"
                            style={{
                              background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                              color: "#FCF6F0",
                              boxShadow: "0 4px 12px rgba(45, 24, 16, 0.25)"
                            }}>
                            <Plus size={14} /> Adicionar
                          </button>
                        )
                      ) : (
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ 
                          color: "#9A8A7A",
                          background: "rgba(154, 138, 122, 0.08)"
                        }}>Disponível em breve</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.filter((p) => p.category === activeCat).length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-20">
                  <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4" style={{
                    background: "rgba(212, 160, 74, 0.08)"
                  }}>
                    <Cookie size={32} color="#D4A04A" />
                  </div>
                  <p className="font-display text-lg" style={{ color: "#5C3D2E" }}>Nenhum produto nesta categoria ainda.</p>
                  <p className="text-sm mt-1" style={{ color: "#9A8A7A" }}>Volte em breve para conferir as novidades!</p>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {step === "dados" && (
        <main className="max-w-lg mx-auto px-6 py-12 animate-fade-in">
          <button onClick={() => setStep("menu")}
            className="text-sm mb-8 flex items-center gap-2 btn-press transition-all group"
            style={{ color: "#5C3D2E" }}>
            <span className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:-translate-x-1" style={{
              background: "#F5E6D3"
            }}>←</span>
            <span className="font-medium">Voltar ao cardápio</span>
          </button>
          
          <div className="rounded-2xl p-8" style={{
            background: "#FFFFFF",
            border: "1px solid rgba(212, 160, 74, 0.15)",
            boxShadow: "0 8px 32px rgba(93, 60, 46, 0.08)"
          }}>
            <h2 className="font-display text-2xl font-bold mb-2" style={{ color: "#2D1810" }}>
              Seus dados
            </h2>
            <p className="text-sm mb-8" style={{ color: "#7A6B5D" }}>Para o padeiro saber quem retira e quando.</p>
            
            <form onSubmit={submitOrder} className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "#5C3D2E" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4A04A" }} /> Nome completo
                </label>
                <input required value={customer.nome} onChange={(e) => setCustomer({ ...customer, nome: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl outline-none transition-all text-sm"
                  style={{ 
                    border: "1px solid rgba(212, 160, 74, 0.2)", 
                    background: "#FDFBF8", 
                    color: "#2D1810"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(212, 160, 74, 0.2)"}
                  placeholder="Seu nome completo" />
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "#5C3D2E" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4A04A" }} /> Telefone
                </label>
                <input required value={customer.telefone} onChange={(e) => setCustomer({ ...customer, telefone: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl outline-none transition-all text-sm"
                  style={{ 
                    border: "1px solid rgba(212, 160, 74, 0.2)", 
                    background: "#FDFBF8", 
                    color: "#2D1810"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(212, 160, 74, 0.2)"}
                  placeholder="(18) 9XXXX-XXXX" />
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "#5C3D2E" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4A04A" }} /> Horário de retirada
                </label>
                <input required value={customer.retirada} onChange={(e) => setCustomer({ ...customer, retirada: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl outline-none transition-all text-sm"
                  style={{ 
                    border: "1px solid rgba(212, 160, 74, 0.2)", 
                    background: "#FDFBF8", 
                    color: "#2D1810"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(212, 160, 74, 0.2)"}
                  placeholder="Ex: hoje às 17h" />
              </div>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "#5C3D2E" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4A04A" }} /> Observações
                </label>
                <textarea value={customer.obs} onChange={(e) => setCustomer({ ...customer, obs: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl outline-none transition-all text-sm resize-none"
                  style={{ 
                    border: "1px solid rgba(212, 160, 74, 0.2)", 
                    background: "#FDFBF8", 
                    color: "#2D1810"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(212, 160, 74, 0.2)"}
                  rows={3} placeholder="Ex: pão de queijo sem sal, sem glúten..." />
              </div>

              <div className="rounded-xl p-5 mt-6" style={{ 
                background: "linear-gradient(135deg, #FDF8F0, #F5E6D3)", 
                border: "1px solid rgba(212, 160, 74, 0.2)" 
              }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "#5C3D2E" }}>
                  <ShoppingBag size={14} color="#D4A04A" />
                  Resumo do pedido
                </p>
                <div className="space-y-2">
                  {cartItems.map((i) => (
                    <div key={i.id} className="flex justify-between text-sm py-1.5" style={{ color: "#5C3D2E" }}>
                      <span>{i.qty}x {i.name}</span>
                      <span className="font-mono-ticket font-medium">{money(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 flex justify-between font-bold text-lg" style={{ 
                  borderTop: "2px solid rgba(212, 160, 74, 0.2)", 
                  color: "#2D1810" 
                }}>
                  <span>TOTAL</span>
                  <span className="font-mono-ticket" style={{ color: "#B85C1E" }}>{money(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={itemCount === 0 || step === "enviando"}
                className="w-full py-4 rounded-xl font-semibold text-base mt-4 disabled:opacity-40 btn-press transition-all"
                style={{
                  background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                  color: "#FCF6F0",
                  boxShadow: "0 6px 20px rgba(45, 24, 16, 0.3)"
                }}>
                {step === "enviando" ? "Enviando..." : "Confirmar encomenda"}
              </button>
            </form>
          </div>
        </main>
      )}

      {step === "enviando" && (
        <main className="max-w-md mx-auto px-6 py-20 text-center animate-fade-in">
          <Wheat size={40} color="#D4A04A" className="mx-auto mb-4 animate-pulse-slow" />
          <p className="font-display text-xl" style={{ color: "#2D1810" }}>Enviando sua encomenda…</p>
        </main>
      )}

      {step === "enviado" && (
        <main className="max-w-lg mx-auto px-6 py-16 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center animate-pop-in" style={{
            background: "linear-gradient(135deg, #4A7C59, #3D6B4E)",
            boxShadow: "0 8px 32px rgba(74, 124, 89, 0.35)"
          }}>
            <Check size={36} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-3xl font-bold mt-8" style={{ color: "#2D1810" }}>Pedido confirmado!</h2>
          <p className="text-base mt-4 leading-relaxed" style={{ color: "#7A6B5D" }}>
            A comanda nº <b className="font-mono-ticket text-lg" style={{ color: "#B85C1E" }}>#{orderNumber}</b> já chegou na padaria.
          </p>
          <p className="text-sm mt-2" style={{ color: "#9A8A7A" }}>
            A Rose vai confirmar com você em breve pelo telefone.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <a href="tel:+5518991914512" className="flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm transition-all hover:scale-105" style={{ 
              background: "#F5E6D3", 
              border: "1px solid rgba(212, 160, 74, 0.2)",
              color: "#5C3D2E" 
            }}>
              <Phone size={16} color="#D4A04A" />
              <span>Precisa falar? <strong>(18) 99191-4512</strong></span>
            </a>
            <button onClick={() => { setCart({}); setCustomer({ nome: "", telefone: "", retirada: "", obs: "" }); setStep("menu"); }}
              className="px-8 py-3.5 rounded-full text-sm font-semibold btn-press transition-all"
              style={{
                background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                color: "#FCF6F0",
                boxShadow: "0 6px 20px rgba(45, 24, 16, 0.3)"
              }}>
              Fazer outra encomenda
            </button>
          </div>
        </main>
      )}

      {step === "fallback" && localOrder && (
        <main className="max-w-md mx-auto px-6 py-10 animate-fade-in">
          <div className="rounded-xl p-5 mb-6 text-center" style={{ background: "#FFF3E0", border: "1px solid #FFCC80" }}>
            <AlertTriangle size={24} color="#E65100" className="mx-auto mb-2" />
            <h3 className="font-display text-lg font-bold mb-1" style={{ color: "#BF360C" }}>Sistema temporariamente offline</h3>
            <p className="text-sm" style={{ color: "#5C3D2E" }}>
              Não foi possível conectar com a padaria automaticamente. Anote ou copie os dados do seu pedido e nos envie pelo WhatsApp ou ligue.
            </p>
          </div>

          <div className="rounded-2xl p-6 font-mono-ticket text-sm" style={{ background: "#FFFFFF", border: "1px solid #D4A04A44", boxShadow: "0 4px 20px rgba(93, 60, 46, 0.08)" }}>
            <p className="font-semibold text-base" style={{ color: "#2D1810" }}>PADARIA DA ROSE</p>
            <p className="mt-1" style={{ color: "#5C3D2E" }}>Pedido #{localOrder.id}</p>
            <p className="text-xs" style={{ color: "#7A6B5D" }}>{localOrder.created_at}</p>
            <BreadDivider />
            <p style={{ color: "#2D1810" }}><strong>{localOrder.customer.nome}</strong></p>
            <p style={{ color: "#5C3D2E" }}>{localOrder.customer.telefone}</p>
            <p style={{ color: "#5C3D2E" }}>Retirada: {localOrder.customer.retirada}</p>
            {localOrder.customer.obs && (
              <p className="mt-1 text-xs" style={{ color: "#7A6B5D" }}>Obs: {localOrder.customer.obs}</p>
            )}
            <BreadDivider />
            {localOrder.items.map((i, idx) => (
              <div key={idx} className="flex justify-between py-1" style={{ color: "#2D1810" }}>
                <span>{i.qty}x {i.name}</span>
                <span>{money(i.price * i.qty)}</span>
              </div>
            ))}
            <BreadDivider />
            <div className="flex justify-between font-semibold text-base" style={{ color: "#2D1810" }}>
              <span>TOTAL</span>
              <span>{money(localOrder.total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <a href="https://wa.me/5518991914512" target="_blank" rel="noopener noreferrer"
              className="w-full py-3.5 rounded-xl font-semibold text-center btn-press transition-all flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #4A7C59, #3D6B4E)",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(74, 124, 89, 0.3)"
              }}>
              Enviar pelo WhatsApp
            </a>
            <button onClick={copyOrderDetails}
              className="w-full py-3 rounded-xl font-medium btn-press transition-all flex items-center justify-center gap-2"
              style={{ background: "#F5E6D3", color: "#5C3D2E", border: "1px solid #D4A04A44" }}>
              {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar pedido</>}
            </button>
            <button onClick={() => { setStep("menu"); setOrderError(null); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium btn-press"
              style={{ color: "#7A6B5D" }}>
              Tentar novamente
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "#7A6B5D" }}>Ou ligue: <strong style={{ color: "#5C3D2E" }}>(18) 99191-4512</strong></p>
          </div>
        </main>
      )}

      {step === "menu" && itemCount > 0 && (
        <button onClick={() => setTicketOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 rounded-full shadow-xl z-30 btn-press transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
            color: "#FCF6F0",
            boxShadow: "0 8px 32px rgba(45, 24, 16, 0.4)"
          }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
            background: "rgba(232, 195, 106, 0.2)"
          }}>
            <ShoppingBag size={16} color="#E8C36A" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
          </div>
          <span className="w-px h-6" style={{ background: "rgba(232, 195, 106, 0.3)" }} />
          <span className="font-mono-ticket text-base font-bold" style={{ color: "#E8C36A" }}>{money(total)}</span>
        </button>
      )}

      {ticketOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center animate-fade-in" style={{ background: "rgba(45, 24, 16, 0.7)" }}>
          <div className="w-full sm:w-[420px] max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl animate-fade-in" style={{ 
            background: "#FFFFFF",
            boxShadow: "0 -8px 40px rgba(0, 0, 0, 0.2)"
          }}>
            <div className="p-6 font-mono-ticket" style={{ color: "#2D1810" }}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                    background: "linear-gradient(135deg, #D4A04A, #E8C36A)"
                  }}>
                    <ShoppingBag size={18} color="#FFFFFF" />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#2D1810" }}>Seu Pedido</p>
                    <p className="text-xs" style={{ color: "#9A8A7A" }}>{new Date().toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <button onClick={() => setTicketOpen(false)} className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{
                  background: "#F5E6D3"
                }}>
                  <X size={16} color="#5C3D2E" />
                </button>
              </div>
              
              <div className="border-t border-dashed" style={{ borderColor: "rgba(212, 160, 74, 0.3)" }} />
              
              <div className="py-5 space-y-3 text-sm">
                {cartItems.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingBag size={32} color="#D4A04A" className="mx-auto mb-3 opacity-30" />
                    <p style={{ color: "#9A8A7A" }}>Sua comanda está vazia.</p>
                  </div>
                )}
                {cartItems.map((i) => (
                  <div key={i.id} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => removeItem(i.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center btn-press transition-all"
                          style={{ 
                            background: "#F5E6D3",
                            border: "1px solid rgba(212, 160, 74, 0.2)"
                          }}>
                          <Minus size={10} color="#5C3D2E" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{i.qty}</span>
                        <button onClick={() => addItem(i.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center btn-press transition-all"
                          style={{ 
                            background: "#5C3D2E",
                            color: "#FFFFFF"
                          }}>
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="flex-1 ml-2 font-medium" style={{ color: "#2D1810" }}>{i.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: "#B85C1E" }}>{money(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed" style={{ borderColor: "rgba(212, 160, 74, 0.3)" }} />
              
              <div className="flex justify-between items-center py-4 text-lg font-bold">
                <span style={{ color: "#2D1810" }}>TOTAL</span>
                <span className="font-mono-ticket" style={{ color: "#B85C1E" }}>{money(total)}</span>
              </div>
              
              <button onClick={() => { setTicketOpen(false); setStep("dados"); }} disabled={itemCount === 0}
                className="w-full py-4 rounded-xl font-semibold text-base mt-3 disabled:opacity-40 btn-press transition-all"
                style={{
                  background: "linear-gradient(135deg, #2D1810, #4A2C1A)",
                  color: "#FCF6F0",
                  boxShadow: "0 6px 20px rgba(45, 24, 16, 0.3)"
                }}>
                Continuar para os dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

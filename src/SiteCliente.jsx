import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Wheat, Flame, Cookie, Plus, Minus, Phone, Clock, X, Check, ShoppingBag, AlertTriangle, Copy, Sparkles, Send, MessageCircle, User, LogIn, LogOut, ChevronDown, Shield, Package, ArrowLeft, RefreshCw } from "lucide-react";
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
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: 4 + Math.random() * 8, height: 4 + Math.random() * 8,
          borderRadius: "50%", background: `rgba(245,158,11,${0.1 + Math.random() * 0.25})`,
          top: `${10 + Math.random() * 80}%`, left: `${5 + Math.random() * 90}%`,
          animation: `floatUp ${4 + Math.random() * 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`
        }} />
      ))}
    </div>
  );
}

const getCustomerData = () => {
  try {
    const raw = localStorage.getItem("padaria_customer");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {}
  return null;
};
const saveCustomerData = (data) => {
  try { localStorage.setItem("padaria_customer", JSON.stringify(data)); } catch {}
};

function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function SiteCliente() {
  const [products, setProducts] = useState([]);
  const [activeCat, setActiveCat] = useState("paes");
  const [cart, setCart] = useState({});
  const [cartObs, setCartObs] = useState({});
  const [ticketOpen, setTicketOpen] = useState(false);
  const [step, setStep] = useState("menu");
  const [customer, setCustomer] = useState({ nome: "", telefone: "", email: "" });
  const [orderNumber, setOrderNumber] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [localOrder, setLocalOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [connectionOk, setConnectionOk] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [session, setSession] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [combinarNoChat, setCombinarNoChat] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [accountTab, setAccountTab] = useState("pedidos");
  const [chatOpen, setChatOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  const employeeSlug = useMemo(() => new URLSearchParams(window.location.search).get("func"), []);

  const generateDays = () => {
    const days = [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        label: i === 0 ? "Hoje" : dayNames[d.getDay()],
        dateStr: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
        isToday: i === 0,
        isSunday: d.getDay() === 0,
      });
    }
    return days;
  };

  const generateTimeSlots = (isSunday) => {
    const slots = [];
    const endHour = isSunday ? 13 : 19;
    const now = new Date();
    const currentHour = now.getHours();
    for (let h = 5; h <= endHour; h++) {
      slots.push({ hour: h, label: `${h}h`, disabled: selectedDate?.isToday && h <= currentHour });
    }
    return slots;
  };

  useEffect(() => {
    if (combinarNoChat) {
      setCustomer(prev => ({ ...prev, retirada: "Combinar no chat" }));
      setSelectedDate(null);
      setSelectedTime(null);
    } else if (selectedDate && selectedTime !== null) {
      setCustomer(prev => ({ ...prev, retirada: `${selectedDate.label}, ${selectedDate.dateStr} às ${selectedTime}h` }));
    } else {
      setCustomer(prev => ({ ...prev, retirada: "" }));
    }
  }, [selectedDate, selectedTime, combinarNoChat]);

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error("PKCE exchange error:", exchangeError);
        } else {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Session error:", error.message);

      setSession(session);
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const nome = meta.full_name || meta.name || "";
        const email = session.user.email || "";
        const avatar = meta.avatar_url || meta.picture || null;
        setCustomer(prev => ({ ...prev, nome: prev.nome || nome, email: email || prev.email }));
        if (avatar) setPhotoUrl(avatar);
        setLoggedIn(true);
        setShowLoginModal(false);
        saveCustomerData({ nome, telefone: customer.telefone, email, photoUrl: avatar || "" });
      } else {
        const saved = getCustomerData();
        if (saved) {
          setCustomer({ nome: saved.nome || "", telefone: saved.telefone || "", email: saved.email || "" });
          if (saved.photoUrl) setPhotoUrl(saved.photoUrl);
          setLoggedIn(true);
        }
      }
    };

    handleAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session?.user) {
        const meta = session.user.user_metadata || {};
        const nome = meta.full_name || meta.name || "";
        const email = session.user.email || "";
        const avatar = meta.avatar_url || meta.picture || null;
        setCustomer(prev => ({ ...prev, nome: prev.nome || nome, email }));
        if (avatar) setPhotoUrl(avatar);
        setLoggedIn(true);
        setShowLoginModal(false);
        saveCustomerData({ nome, telefone: customer.telefone, email, photoUrl: avatar || "" });
        setSession(session);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setLoggedIn(false);
      }
    });

    supabase.from("products").select("*").order("category").then(({ data, error }) => {
      setLoading(false);
      if (error) {
        console.error("[Padaria] Erro ao carregar produtos:", error.message);
        setConnectionOk(false);
      } else {
        setProducts(data || []);
        setConnectionOk(true);
      }
    }).catch((err) => {
      console.error("[Padaria] Falha na conexão com Supabase:", err);
      setLoading(false);
      setConnectionOk(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (step === "menu") setOrderError(null);
  }, [step]);

  const cartItems = useMemo(
    () => Object.entries(cart).filter(([, qty]) => qty > 0).map(([id, qty]) => {
      const prod = products.find((p) => p.id === id);
      return { ...prod, qty, obs: cartObs[id] || "" };
    }),
    [cart, products, cartObs]
  );

  const total = cartItems.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const addItem = useCallback((id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })), []);
  const removeItem = useCallback((id) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) })), []);
  const updateObs = (id, text) => setCartObs((o) => ({ ...o, [id]: text }));

  const handleLoginSave = () => {
    if (customer.nome && customer.telefone) {
      const data = { nome: customer.nome, telefone: customer.telefone, email: customer.email || "" };
      saveCustomerData(data);
      setLoggedIn(true);
      setShowLoginModal(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("padaria_customer");
    setCustomer({ nome: "", telefone: "", email: "" });
    setLoggedIn(false);
    setSession(null);
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) {
        setLoginError("Erro ao entrar com Google. Tente novamente.");
        setLoginLoading(false);
      }
    } catch (err) {
      console.error("Google login error:", err);
      setLoginError("Erro inesperado. Tente novamente.");
      setLoginLoading(false);
    }
  };

  const loadMyOrders = async () => {
    if (!customer.telefone) return;
    setLoadingOrders(true);
    const { data, error } = await supabase.rpc("get_customer_orders", { p_phone: customer.telefone });
    if (error) {
      console.error("[Padaria] Erro ao carregar pedidos:", error.message);
      setMyOrders([]);
    } else {
      setMyOrders(data || []);
    }
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (step === "conta" && customer.telefone) loadMyOrders();
  }, [step, customer.telefone]);

  const submitOrder = async (e) => {
    e.preventDefault();
    setStep("enviando");
    saveCustomerData({ nome: customer.nome, telefone: customer.telefone, email: customer.email || "" });

    const items = cartItems.map((i) => ({
      product_name: i.name, qty: i.qty, unit_price: i.price, observation: i.obs || "",
    }));
    const allNotes = cartItems.filter((i) => i.obs).map((i) => `${i.name}: ${i.obs}`).join("; ");

    let orderResult = null;
    let error = null;

    const { data: rpcData, error: rpcError } = await supabase.rpc("create_order", {
      p_customer_name: customer.nome, p_customer_phone: customer.telefone,
      p_pickup_time: customer.retirada, p_notes: allNotes || null,
      p_employee_slug: employeeSlug, p_total: total, p_items: items,
    });

    if (rpcError) {
      console.warn("[Padaria] create_order RPC falhou, tentando insert direto:", rpcError.message);
      const { data: insertData, error: insertError } = await supabase
        .from("orders")
        .insert({
          customer_name: customer.nome,
          customer_phone: customer.telefone,
          pickup_time: customer.retirada,
          notes: allNotes || null,
          employee_slug: employeeSlug,
          total: total,
        })
        .select()
        .single();

      if (insertError) {
        error = insertError;
      } else {
        for (const item of items) {
          await supabase.from("order_items").insert({
            order_id: insertData.id,
            product_name: item.product_name,
            qty: item.qty,
            unit_price: item.unit_price,
            observation: item.observation || "",
          });
        }
        orderResult = insertData;
      }
    } else {
      orderResult = rpcData;
    }

    if (error) {
      const fallback = {
        id: Date.now().toString().slice(-6), customer: { ...customer },
        items: [...cartItems], total, created_at: new Date().toLocaleString("pt-BR"),
      };
      const saved = JSON.parse(localStorage.getItem("orders_fallback") || "[]");
      saved.push(fallback);
      localStorage.setItem("orders_fallback", JSON.stringify(saved));
      setLocalOrder(fallback);
      setOrderError(error.message);
      setStep("fallback");
      return;
    }

    const orderId = orderResult?.id || (Array.isArray(orderResult) ? orderResult[0]?.id : orderResult);
    setOrderNumber(orderId);
    setStep("enviado");
  };

  const copyOrderDetails = () => {
    if (!localOrder) return;
    const text = `PADARIA DA ROSE - Pedido #${localOrder.id}\n${localOrder.customer.nome} - ${localOrder.customer.telefone}\nRetirada: ${localOrder.customer.retirada}\n${localOrder.items.map((i) => `${i.qty}x ${i.name}${i.obs ? ` (${i.obs})` : ""} - ${money(i.price * i.qty)}`).join("\n")}\nTOTAL: ${money(localOrder.total)}`;
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
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes fabPulse { 0% { box-shadow: 0 4px 20px rgba(37,211,102,0.4); } 50% { box-shadow: 0 4px 30px rgba(37,211,102,0.6), 0 0 0 8px rgba(37,211,102,0.1); } 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.4); } }
        .animate-fade-up { animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-fade-in { animation: fadeIn 0.4s ease both; }
        .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-pulse-slow { animation: pulse 2.5s ease-in-out infinite; }
        .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-border-shine { animation: borderShine 3s ease-in-out infinite; }
        .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .animate-breathe { animation: breathe 3s ease-in-out infinite; }
        .animate-fab-pulse { animation: fabPulse 2s ease-in-out infinite; }
        .card-hover { transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, border-color 0.4s ease; }
        .card-hover:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 28px 56px rgba(180,83,9,0.18) !important; border-color: rgba(245,158,11,0.35) !important; }
        .card-hover:active { transform: translateY(-4px) scale(1.005); }
        .btn-press { transition: all 0.15s ease; }
        .btn-press:active { transform: scale(0.95); }
        .btn-hover { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .btn-hover:hover { filter: brightness(1.1); transform: translateY(-2px); box-shadow: 0 12px 32px rgba(245,158,11,0.4) !important; }
        input:focus, textarea:focus { outline: none; box-shadow: 0 0 0 3px rgba(245,158,11,0.25) !important; border-color: #F59E0B !important; }
        input::placeholder, textarea::placeholder { color: #C5B5A5; }
        .category-pill { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
        .category-pill:hover { transform: translateY(-3px); }
        .category-pill.active { transform: scale(1.06); }
        .gradient-text {
          background: linear-gradient(135deg, #F59E0B, #EF4444, #F59E0B);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .hero-pattern {
          background-image: radial-gradient(circle at 20% 80%, rgba(245,158,11,0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(239,68,68,0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%);
        }
        .hero-bg-animated {
          background: linear-gradient(160deg, #1C0A00 0%, #3D1C0A 30%, #5C2E0E 55%, #7A3B12 80%, #8B4513 100%);
          background-size: 200% 200%; animation: gradientMove 8s ease infinite;
        }
        .product-card-shadow { box-shadow: 0 4px 24px rgba(120,53,15,0.08), 0 1px 3px rgba(120,53,15,0.04); }
        .product-card-shadow:hover { box-shadow: 0 28px 56px rgba(180,83,9,0.18), 0 4px 12px rgba(120,53,15,0.08) !important; }
        .wave-divider { position: relative; overflow: hidden; }
        .wave-divider::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 60px;
          background: #FFF8F0; clip-path: ellipse(55% 100% at 50% 100%);
        }
        .chat-fab {
          position: fixed; bottom: 24px; right: 24px; z-index: 50;
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #25D366, #128C7E);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 24px rgba(37,211,102,0.4);
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .chat-fab:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(37,211,102,0.5); }
        .chat-fab:active { transform: scale(0.95); }
        .login-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(28,10,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        .login-modal {
          width: 90%; max-width: 400px; background: #FFFFFF; border-radius: 24px;
          overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.25);
          animation: scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .social-btn {
          width: 100%; padding: 14px 20px; border-radius: 14px;
          border: 1.5px solid rgba(0,0,0,0.1); background: #FFFFFF;
          color: #1C0A00; font-weight: 600; font-size: 0.95rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
          transition: all 0.25s ease;
        }
        .social-btn:hover { border-color: rgba(0,0,0,0.2); box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .social-btn:active { transform: scale(0.98); }
        .social-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        @media (max-width: 640px) { .chat-fab { bottom: 16px; right: 16px; width: 54px; height: 54px; } }
      `}</style>

      {/* HEADER / HERO */}
      <header className="hero-bg-animated wave-divider" style={{ position: "relative", overflow: "hidden" }}>
        <FloatingParticles />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-50%", left: "-15%", width: "70%", height: "180%", background: "radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "55%", height: "140%", background: "radial-gradient(ellipse, rgba(239,68,68,0.08) 0%, transparent 55%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6), rgba(239,68,68,0.4), transparent)" }} />
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-4 flex justify-end relative" style={{ zIndex: 2 }}>
          {loggedIn ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <button onClick={() => setStep(step === "conta" ? "menu" : "conta")} className="btn-hover" style={{
                padding: "8px 16px", borderRadius: 100,
                background: step === "conta" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                color: "#F5D89A", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.25s"
              }}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Foto" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(245,158,11,0.4)" }} />
                ) : (
                  <User size={14} />
                )}
                {step === "conta" ? "Cardápio" : customer.nome ? customer.nome.split(" ")[0] : "Minha Conta"}
              </button>
              <button onClick={handleLogout} style={{
                padding: "8px 14px", borderRadius: 100,
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#F5B8A8", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s"
              }}>
                <LogOut size={12} /> Sair
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="btn-hover" style={{
              padding: "8px 18px", borderRadius: 100,
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
              color: "#F5D89A", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, transition: "all 0.25s",
              backdropFilter: "blur(8px)"
            }}>
              <User size={14} /> Entrar
            </button>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-8 pb-24 flex flex-col items-center text-center relative" style={{ zIndex: 1 }}>
          <div className="mb-6 animate-fade-up" style={{ animationDelay: "0s" }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%", overflow: "hidden",
              boxShadow: "0 0 0 4px rgba(245,158,11,0.3), 0 0 0 8px rgba(245,158,11,0.1), 0 0 50px rgba(245,158,11,0.25), 0 20px 60px rgba(0,0,0,0.4)",
              position: "relative", animation: "glow 3s ease-in-out infinite"
            }}>
              <img src="/logo.png" alt="Padaria da Rose" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>
          <h1 className="font-display animate-fade-up" style={{
            fontSize: "clamp(2.8rem, 8vw, 4.8rem)", fontWeight: 900, color: "#FFF8F0",
            letterSpacing: "-0.04em", lineHeight: 1.05, animationDelay: "0.08s",
            textShadow: "0 4px 30px rgba(0,0,0,0.4)"
          }}>
            Padaria <span className="gradient-text">da Rose</span>
          </h1>
          <div className="flex items-center gap-4 my-5 animate-fade-up" style={{ animationDelay: "0.14s" }}>
            <div style={{ height: 2, width: 60, background: "linear-gradient(90deg, transparent, #F59E0B)" }} />
            <Sparkles size={20} color="#F59E0B" style={{ filter: "drop-shadow(0 0 6px rgba(245,158,11,0.6))", animation: "breathe 2s ease-in-out infinite" }} />
            <div style={{ height: 2, width: 60, background: "linear-gradient(90deg, #F59E0B, transparent)" }} />
          </div>
          <p className="animate-fade-up" style={{ color: "#D4B896", fontSize: "1.15rem", maxWidth: 440, lineHeight: 1.7, animationDelay: "0.18s", fontWeight: 300 }}>
            Pães artesanais, bolos e doces feitos com amor.<br />
            <span style={{ color: "#A08068", fontSize: "0.95rem", fontWeight: 400 }}>Encomende direto pelo celular e retire na padaria.</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7 animate-fade-up" style={{ animationDelay: "0.22s" }}>
            <a href="tel:+5518991914512" className="btn-hover" style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 100,
              background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
              color: "#F5D89A", fontSize: "0.9rem", textDecoration: "none", backdropFilter: "blur(8px)", transition: "all 0.3s"
            }}>
              <Phone size={15} color="#F59E0B" /> (18) 99191-4512
            </a>
            <span style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 100,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)",
              color: "#F5B8A8", fontSize: "0.9rem"
            }}>
              <Clock size={15} color="#EF4444" /> Seg–Sáb, 5h–19h | Dom, 5h–13h
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            {[
              { icon: "🍞", text: "Pães Frescos" },
              { icon: "☕", text: "Café da Manhã" },
              { icon: "🏪", text: "Retire na Loja" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2" style={{
                padding: "8px 16px", borderRadius: 100,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                animation: `wave 2s ease-in-out ${i * 0.2}s infinite`
              }}>
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                <span style={{ color: "#C5A880", fontSize: "0.82rem", fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {!connectionOk && (
        <div className="max-w-5xl mx-auto px-5 pt-4">
          <div className="rounded-2xl p-4 flex items-start gap-3 animate-fade-up" style={{
            background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "1px solid #F59E0B", boxShadow: "0 4px 20px rgba(245,158,11,0.2)"
          }}>
            <AlertTriangle size={18} color="#B45309" style={{ marginTop: 1, flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#78350F" }}>
              <strong style={{ color: "#92400E" }}>Sistema offline.</strong> Seu pedido será salvo localmente.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════ MENU ═══════════════ */}
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
                    boxShadow: isActive ? `0 8px 28px rgba(245,158,11,0.4), 0 0 0 1px rgba(255,255,255,0.2) inset` : "0 2px 12px rgba(0,0,0,0.06)"
                  }}>
                  <Icon size={16} /> {c.label}
                  {isActive && <Sparkles size={12} style={{ marginLeft: 2 }} />}
                </button>
              );
            })}
          </nav>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <Wheat size={48} color="#F59E0B" className="animate-pulse-slow" style={{ filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))" }} />
              <span style={{ color: "#8A7A6A", fontSize: "0.95rem", fontWeight: 500 }}>Carregando cardápio…</span>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
              {products.filter((p) => p.category === activeCat).map((p, idx) => (
                <div key={p.id} className="card-hover product-card-shadow rounded-2xl overflow-hidden"
                  style={{
                    background: "#FFFFFF", border: "1.5px solid rgba(245,158,11,0.1)",
                    opacity: p.available ? 1 : 0.5,
                    animation: `fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.06}s both`
                  }}>
                  <div style={{
                    height: 5, background: p.available ? "linear-gradient(90deg, #F59E0B, #EF4444, #8B5CF6, #F59E0B)" : "#E8E0D8",
                    backgroundSize: "200% 100%", animation: p.available ? "shimmer 4s linear infinite" : "none"
                  }} />
                  {p.image_url && (
                    <div style={{ height: 160, overflow: "hidden", background: "#FFF8F0" }}>
                      <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ padding: "24px 24px 22px" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div style={{ flex: 1 }}>
                        <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1C0A00", lineHeight: 1.2 }}>{p.name}</h3>
                        {p.description && <p style={{ fontSize: "0.85rem", color: "#7A6B5D", marginTop: 6, lineHeight: 1.6 }}>{p.description}</p>}
                      </div>
                      {!p.available ? (
                        <span style={{
                          fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em",
                          padding: "5px 12px", borderRadius: 100,
                          background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(236,72,153,0.08))", color: "#DC2626",
                          border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0,
                          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600
                        }}>Esgotado</span>
                      ) : (
                        <span style={{
                          fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em",
                          padding: "5px 10px", borderRadius: 100,
                          background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.08))", color: "#059669",
                          border: "1px solid rgba(16,185,129,0.2)", flexShrink: 0,
                          fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
                          display: "flex", alignItems: "center", gap: 4
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                          Disponível
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1.5px dashed rgba(245,158,11,0.15)" }}>
                      <div>
                        <span className="font-mono-ticket" style={{ fontSize: "1.35rem", fontWeight: 700, color: "#DC2626", animation: "priceGlow 3s ease-in-out infinite" }}>
                          {money(p.price)}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "#9A8A7A", marginLeft: 4 }}>/ {p.unit}</span>
                      </div>
                      {p.available ? (
                        (cart[p.id] || 0) > 0 ? (
                          <div className="flex items-center gap-3" style={{ animation: "scaleIn 0.3s ease both" }}>
                            <button onClick={() => removeItem(p.id)} className="btn-press" style={{
                              width: 38, height: 38, borderRadius: "50%", background: "#FEF3C7",
                              border: "1.5px solid rgba(245,158,11,0.3)", color: "#92400E",
                              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                            }}><Minus size={14} /></button>
                            <span className="font-mono-ticket animate-pop-in" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1C0A00", width: 30, textAlign: "center" }}>{cart[p.id]}</span>
                            <button onClick={() => addItem(p.id)} className="btn-press" style={{
                              width: 38, height: 38, borderRadius: "50%",
                              background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFFFFF",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              boxShadow: "0 4px 16px rgba(245,158,11,0.45)", cursor: "pointer", border: "none"
                            }}><Plus size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addItem(p.id)} className="btn-press btn-hover" style={{
                            fontSize: "0.85rem", fontWeight: 700, padding: "11px 22px", borderRadius: 100,
                            background: "linear-gradient(135deg, #1C0A00, #3D1C0A)", color: "#F5D89A", border: "none",
                            boxShadow: "0 4px 18px rgba(28,10,0,0.3)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer"
                          }}><Plus size={14} /> Adicionar</button>
                        )
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#9A8A7A", padding: "8px 16px", background: "rgba(154,138,122,0.08)", borderRadius: 100, fontWeight: 500 }}>Em breve</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.filter((p) => p.category === activeCat).length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3 text-center py-20">
                  <div style={{
                    width: 88, height: 88, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 18px", boxShadow: "0 0 40px rgba(245,158,11,0.15)",
                    animation: "breathe 3s ease-in-out infinite"
                  }}><Cookie size={38} color="#F59E0B" /></div>
                  <p className="font-display" style={{ color: "#1C0A00", fontSize: "1.15rem", fontWeight: 600 }}>Nenhum produto nesta categoria.</p>
                  <p style={{ color: "#9A8A7A", fontSize: "0.88rem", marginTop: 8 }}>Volte em breve para conferir as novidades!</p>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ═══════════════ DADOS ═══════════════ */}
      {step === "dados" && (
        <main className="max-w-lg mx-auto px-5 py-12 animate-fade-up">
          <button onClick={() => setStep("menu")} className="btn-press flex items-center gap-2.5 mb-8" style={{ background: "none", border: "none", color: "#5C3D2E", cursor: "pointer", fontSize: "0.92rem", fontWeight: 600 }}>
            <span style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>←</span>
            Voltar ao cardápio
          </button>
          <div style={{ background: "#FFFFFF", borderRadius: 24, border: "1.5px solid rgba(245,158,11,0.15)", boxShadow: "0 16px 56px rgba(120,53,15,0.1)", overflow: "hidden" }}>
            <div style={{ padding: "32px 32px 0", background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(239,68,68,0.03))", borderBottom: "1px solid rgba(245,158,11,0.08)" }}>
              <h2 className="font-display" style={{ fontSize: "1.85rem", fontWeight: 800, color: "#1C0A00", marginBottom: 6 }}>Seus dados</h2>
              <p style={{ fontSize: "0.9rem", color: "#7A6B5D", marginBottom: 28 }}>Para o padeiro saber quem retira e quando.</p>
            </div>
            <form onSubmit={submitOrder} style={{ padding: "28px 32px 32px" }}>
              {loggedIn && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 14, marginBottom: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.05))", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Shield size={14} color="#10B981" />
                    <span style={{ fontSize: "0.82rem", color: "#065F46", fontWeight: 500 }}>
                      {session?.user ? `Conectado como ${customer.nome?.split(" ")[0]}` : "Dados preenchidos automaticamente"}
                    </span>
                  </div>
                  <button type="button" onClick={handleLogout} style={{ fontSize: "0.75rem", color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Trocar</button>
                </div>
              )}
              {[
                { label: "Nome completo", key: "nome", placeholder: "Seu nome completo", type: "text", icon: "👤" },
                { label: "Telefone", key: "telefone", placeholder: "(18) 9XXXX-XXXX", type: "tel", icon: "📱" },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#78350F", marginBottom: 8 }}>{field.icon} {field.label}</label>
                  <input required type={field.type} value={customer[field.key]} onChange={(e) => setCustomer({ ...customer, [field.key]: e.target.value })} placeholder={field.placeholder}
                    style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: "1.5px solid rgba(245,158,11,0.2)", background: "#FFFBF5", color: "#1C0A00", fontSize: "0.95rem", transition: "all 0.25s", boxSizing: "border-box" }} />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#78350F", marginBottom: 10 }}>⏰ Quando vai retirar?</label>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 14, scrollbarWidth: "none" }}>
                  {generateDays().map((day, i) => {
                    const isSelected = selectedDate?.dateStr === day.dateStr && !combinarNoChat;
                    return (
                      <button key={i} type="button" onClick={() => { if (!combinarNoChat) { setSelectedDate(day); setSelectedTime(null); } }}
                        style={{
                          minWidth: 72, padding: "12px 10px", borderRadius: 14,
                          border: isSelected ? "2px solid #F59E0B" : "1.5px solid rgba(245,158,11,0.15)",
                          background: isSelected ? "linear-gradient(135deg, #F59E0B, #F97316)" : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : "#5C3D2E",
                          cursor: combinarNoChat ? "not-allowed" : "pointer",
                          opacity: combinarNoChat ? 0.4 : 1, transition: "all 0.25s", flexShrink: 0,
                          boxShadow: isSelected ? "0 4px 16px rgba(245,158,11,0.35)" : "0 2px 8px rgba(0,0,0,0.04)"
                        }}>
                        <p style={{ fontSize: "0.72rem", fontWeight: 700, marginBottom: 2 }}>{day.label}</p>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600 }}>{day.dateStr}</p>
                      </button>
                    );
                  })}
                </div>
                {selectedDate && !combinarNoChat && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {generateTimeSlots(selectedDate.isSunday).map((slot) => {
                      const isSelected = selectedTime === slot.hour;
                      return (
                        <button key={slot.hour} type="button" onClick={() => { if (!slot.disabled) setSelectedTime(slot.hour); }}
                          style={{
                            width: 56, height: 44, borderRadius: 12,
                            border: isSelected ? "2px solid #F59E0B" : "1.5px solid rgba(245,158,11,0.15)",
                            background: isSelected ? "linear-gradient(135deg, #F59E0B, #F97316)" : "#FFFFFF",
                            color: isSelected ? "#FFFFFF" : slot.disabled ? "#D1C4B8" : "#5C3D2E",
                            cursor: slot.disabled ? "not-allowed" : "pointer", opacity: slot.disabled ? 0.4 : 1,
                            fontSize: "0.88rem", fontWeight: 600, transition: "all 0.2s",
                            boxShadow: isSelected ? "0 4px 12px rgba(245,158,11,0.3)" : "none"
                          }}>{slot.label}</button>
                      );
                    })}
                  </div>
                )}
                <button type="button" onClick={() => setCombinarNoChat(!combinarNoChat)} style={{
                  width: "100%", padding: "14px", borderRadius: 14,
                  border: combinarNoChat ? "2px solid #25D366" : "1.5px solid rgba(37,211,102,0.25)",
                  background: combinarNoChat ? "linear-gradient(135deg, #25D366, #128C7E)" : "#FFFFFF",
                  color: combinarNoChat ? "#FFFFFF" : "#128C7E",
                  cursor: "pointer", fontWeight: 700, fontSize: "0.92rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: combinarNoChat ? "0 4px 16px rgba(37,211,102,0.35)" : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.25s"
                }}>💬 Combinar no chat</button>
                {combinarNoChat && <p style={{ fontSize: "0.82rem", color: "#128C7E", marginTop: 8, textAlign: "center", fontWeight: 500 }}>A padaria vai entrar em contato para combinar o horário.</p>}
                {customer.retirada && !combinarNoChat && <p style={{ fontSize: "0.85rem", color: "#78350F", marginTop: 10, fontWeight: 600, textAlign: "center" }}>✅ Retirada: {customer.retirada}</p>}
              </div>

              {!loggedIn && customer.nome && customer.telefone && (
                <button type="button" onClick={handleLoginSave} style={{
                  width: "100%", padding: "12px", borderRadius: 12, marginBottom: 20,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
                  border: "1px solid rgba(99,102,241,0.2)", color: "#4338CA",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                }}><LogIn size={14} /> Salvar meus dados para próxima compra</button>
              )}

              {cartItems.some((i) => i.has_obs) && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#78350F", marginBottom: 12 }}>💬 Observações por produto</p>
                  {cartItems.filter((i) => i.has_obs).map((i) => (
                    <div key={i.id} style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#5C3D2E", marginBottom: 6 }}>
                        {i.qty}x {i.name} — <span style={{ color: "#9A8A7A", fontWeight: 400 }}>{i.obs_label || "Observação"}</span>
                      </label>
                      <input type="text" value={cartObs[i.id] || ""} onChange={(e) => updateObs(i.id, e.target.value)} placeholder={i.obs_label || "Ex: sem sal, bem passado..."}
                        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1.5px solid rgba(245,158,11,0.2)", background: "#FFFBF5", color: "#1C0A00", fontSize: "0.9rem", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "1.5px solid rgba(245,158,11,0.25)", borderRadius: 16, padding: "18px 20px", marginBottom: 24, boxShadow: "0 4px 16px rgba(245,158,11,0.12)" }}>
                <p style={{ fontSize: "0.74rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#78350F", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShoppingBag size={14} color="#F59E0B" /> Resumo do pedido
                </p>
                {cartItems.map((i) => (
                  <div key={i.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#78350F", padding: "3px 0" }}>
                      <span>{i.qty}x {i.name}</span>
                      <span className="font-mono-ticket" style={{ fontWeight: 600 }}>{money(i.price * i.qty)}</span>
                    </div>
                    {i.obs && <p style={{ fontSize: "0.78rem", color: "#9A8A7A", fontStyle: "italic", paddingLeft: 8 }}>→ {i.obs}</p>}
                  </div>
                ))}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "2px dashed rgba(245,158,11,0.3)", display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", color: "#1C0A00" }}>
                  <span>TOTAL</span>
                  <span className="font-mono-ticket" style={{ color: "#DC2626" }}>{money(total)}</span>
                </div>
              </div>

              <button type="submit" disabled={itemCount === 0 || step === "enviando"} className="btn-press btn-hover" style={{
                width: "100%", padding: "16px", borderRadius: 16,
                background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)", backgroundSize: "200% 200%",
                animation: itemCount > 0 ? "gradientMove 3s ease infinite" : "none",
                color: "#FFFFFF", fontWeight: 800, fontSize: "1.05rem", border: "none", cursor: "pointer",
                boxShadow: "0 8px 28px rgba(245,158,11,0.35)", opacity: itemCount === 0 ? 0.4 : 1
              }}>
                {step === "enviando" ? "Enviando..." : "✨ Confirmar encomenda ✨"}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* ═══════════════ MINHA CONTA ═══════════════ */}
      {step === "conta" && (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-32 animate-fade-up">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep("menu")} className="btn-press" style={{
              width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
              border: "1.5px solid rgba(245,158,11,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}><ArrowLeft size={18} color="#78350F" /></button>
            <div>
              <h2 className="font-display" style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1C0A00" }}>Minha Conta</h2>
              <p style={{ fontSize: "0.88rem", color: "#7A6B5D" }}>Olá, {customer.nome?.split(" ")[0]}!</p>
            </div>
          </div>

          {/* Account tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#FFFFFF", borderRadius: 16, padding: 6, border: "1.5px solid rgba(245,158,11,0.12)" }}>
            {[
              { id: "pedidos", label: "Meus Pedidos", icon: Package },
              { id: "chat", label: "Chat", icon: MessageCircle },
            ].map((t) => {
              const Icon = t.icon;
              const active = accountTab === t.id;
              return (
                <button key={t.id} onClick={() => setAccountTab(t.id)} style={{
                  flex: 1, padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                  background: active ? "linear-gradient(135deg, #F59E0B, #F97316)" : "transparent",
                  color: active ? "#FFFFFF" : "#7A6B5D", fontWeight: 700, fontSize: "0.88rem",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.25s"
                }}><Icon size={16} /> {t.label}</button>
              );
            })}
          </div>

          {/* Orders tab */}
          {accountTab === "pedidos" && (
            <div>
              {!customer.telefone ? (
                <div className="text-center py-16">
                  <User size={48} color="#D4B896" style={{ margin: "0 auto 16px", opacity: 0.4 }} />
                  <p style={{ color: "#7A6B5D", fontSize: "1rem", fontWeight: 600 }}>Faça login para ver seus pedidos</p>
                  <p style={{ color: "#9A8A7A", fontSize: "0.88rem", marginTop: 8 }}>Entre com seu nome e telefone para acessar seu histórico.</p>
                  <button onClick={() => setShowLoginModal(true)} className="btn-hover" style={{
                    marginTop: 16, padding: "12px 28px", borderRadius: 100,
                    background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFFFFF",
                    fontWeight: 700, fontSize: "0.92rem", border: "none", cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(245,158,11,0.3)"
                  }}>Entrar</button>
                </div>
              ) : loadingOrders ? (
                <div className="text-center py-16">
                  <Wheat size={36} color="#F59E0B" className="animate-pulse-slow" style={{ margin: "0 auto 12px" }} />
                  <p style={{ color: "#9A8A7A", fontSize: "0.92rem" }}>Carregando pedidos...</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-16">
                  <Package size={48} color="#D4B896" style={{ margin: "0 auto 16px", opacity: 0.4 }} />
                  <p style={{ color: "#7A6B5D", fontSize: "1rem", fontWeight: 600 }}>Nenhum pedido ainda</p>
                  <p style={{ color: "#9A8A7A", fontSize: "0.88rem", marginTop: 8 }}>Seus pedidos aparecerão aqui.</p>
                  <button onClick={() => setStep("menu")} className="btn-hover" style={{
                    marginTop: 16, padding: "12px 28px", borderRadius: 100,
                    background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFFFFF",
                    fontWeight: 700, fontSize: "0.92rem", border: "none", cursor: "pointer"
                  }}>Ver cardápio</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {myOrders.map((order) => (
                    <div key={order.id} style={{
                      background: "#FFFFFF", borderRadius: 18, overflow: "hidden",
                      border: "1.5px solid rgba(245,158,11,0.12)",
                      boxShadow: "0 4px 20px rgba(120,53,15,0.06)"
                    }}>
                      <div style={{ height: 4, background: "linear-gradient(90deg, #F59E0B, #EF4444)" }} />
                      <div style={{ padding: "18px 22px" }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono-ticket" style={{ fontSize: "0.92rem", fontWeight: 700, color: "#1C0A00" }}>#{order.id}</span>
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                              padding: "4px 10px", borderRadius: 100,
                              background: order.status === "concluido" ? "rgba(16,185,129,0.1)" : order.status === "cancelado" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                              color: order.status === "concluido" ? "#059669" : order.status === "cancelado" ? "#DC2626" : "#D97706"
                            }}>
                              {order.status === "concluido" ? "Concluído" : order.status === "cancelado" ? "Cancelado" : "Pendente"}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.78rem", color: "#9A8A7A" }}>
                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {order.items && (
                          <div style={{ marginBottom: 10 }}>
                            {order.items.map((item, idx) => (
                              <p key={idx} style={{ fontSize: "0.85rem", color: "#5C3D2E", padding: "2px 0" }}>
                                {item.qty}x {item.product_name}
                                {item.observation && <span style={{ color: "#9A8A7A", fontStyle: "italic" }}> ({item.observation})</span>}
                              </p>
                            ))}
                          </div>
                        )}
                        {order.notes && <p style={{ fontSize: "0.82rem", color: "#9A8A7A", fontStyle: "italic", marginBottom: 8 }}>📝 {order.notes}</p>}
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px dashed rgba(245,158,11,0.15)" }}>
                          <span style={{ fontSize: "0.82rem", color: "#7A6B5D" }}>Retirada: {order.pickup_time || "A combinar"}</span>
                          <span className="font-mono-ticket" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#DC2626" }}>{money(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={loadMyOrders} className="btn-press" style={{
                marginTop: 16, width: "100%", padding: "10px", borderRadius: 12,
                background: "#FFFFFF", border: "1.5px solid rgba(245,158,11,0.2)", color: "#5C3D2E",
                fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}><RefreshCw size={14} /> Atualizar pedidos</button>
            </div>
          )}

          {/* Chat tab */}
          {accountTab === "chat" && (
            <ChatPanel customerName={customer.nome} customerPhone={customer.telefone || customer.email} />
          )}
        </main>
      )}

      {/* ═══════════════ ENVIANDO ═══════════════ */}
      {step === "enviando" && (
        <main className="max-w-md mx-auto px-6 py-24 text-center animate-fade-in">
          <div style={{ animation: "breathe 1.5s ease-in-out infinite" }}>
            <Wheat size={48} color="#F59E0B" style={{ margin: "0 auto 18px", filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))" }} className="animate-pulse-slow" />
          </div>
          <p className="font-display" style={{ fontSize: "1.4rem", color: "#1C0A00", fontWeight: 600 }}>Enviando sua encomenda…</p>
          <p style={{ color: "#9A8A7A", fontSize: "0.9rem", marginTop: 8 }}>Aguarde um momento</p>
        </main>
      )}

      {/* ═══════════════ ENVIADO ═══════════════ */}
      {step === "enviado" && (
        <main className="max-w-lg mx-auto px-5 py-20 text-center animate-fade-up">
          <div className="animate-pop-in" style={{
            width: 96, height: 96, borderRadius: "50%", margin: "0 auto 30px",
            background: "linear-gradient(135deg, #10B981, #059669)",
            boxShadow: "0 0 50px rgba(16,185,129,0.4), 0 16px 40px rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}><Check size={46} color="#FFFFFF" strokeWidth={2.5} /></div>
          <h2 className="font-display" style={{ fontSize: "2.4rem", fontWeight: 800, color: "#1C0A00", marginBottom: 14 }}>Pedido confirmado!</h2>
          <p style={{ fontSize: "1.05rem", color: "#7A6B5D", lineHeight: 1.7 }}>
            A comanda nº <b className="font-mono-ticket" style={{ fontSize: "1.15rem", color: "#DC2626" }}>#{orderNumber}</b> já chegou na padaria.
          </p>
          <p style={{ fontSize: "0.9rem", color: "#9A8A7A", marginTop: 10 }}>A Rose vai confirmar com você em breve pelo telefone.</p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <a href="tel:+5518991914512" className="btn-hover" style={{
              display: "flex", alignItems: "center", gap: 10, padding: "14px 26px", borderRadius: 16,
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "1.5px solid rgba(245,158,11,0.3)",
              color: "#78350F", textDecoration: "none", fontSize: "0.92rem", fontWeight: 600
            }}>
              <Phone size={16} color="#F59E0B" /> Precisa falar? <strong>(18) 99191-4512</strong>
            </a>
            <button onClick={() => {
              setCart({}); setCartObs({}); setCustomer(prev => ({ ...prev, retirada: "" }));
              setSelectedDate(null); setSelectedTime(null); setCombinarNoChat(false); setStep("menu");
            }} className="btn-press" style={{
              padding: "14px 36px", borderRadius: 100,
              background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFFFFF",
              fontWeight: 700, fontSize: "0.92rem", border: "none", cursor: "pointer",
              boxShadow: "0 8px 24px rgba(245,158,11,0.35)"
            }}>Fazer outra encomenda</button>
            <button onClick={() => { setStep("conta"); setAccountTab("chat"); }} style={{
              padding: "12px 24px", borderRadius: 100, background: "none",
              border: "1.5px solid rgba(37,211,102,0.3)", color: "#128C7E",
              fontWeight: 600, fontSize: "0.88rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8
            }}><MessageCircle size={16} /> Conversar com a padaria</button>
          </div>
        </main>
      )}

      {/* ═══════════════ FALLBACK ═══════════════ */}
      {step === "fallback" && localOrder && (
        <main className="max-w-md mx-auto px-5 py-10 animate-fade-up">
          <div style={{ borderRadius: 20, padding: "18px 22px", marginBottom: 22, background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", border: "1.5px solid #F59E0B", textAlign: "center", boxShadow: "0 4px 20px rgba(245,158,11,0.2)" }}>
            <AlertTriangle size={24} color="#B45309" style={{ margin: "0 auto 10px" }} />
            <h3 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#92400E", marginBottom: 6 }}>Sistema temporariamente offline</h3>
            <p style={{ fontSize: "0.88rem", color: "#78350F", lineHeight: 1.6 }}>Não foi possível conectar automaticamente.</p>
          </div>
          <div className="font-mono-ticket" style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px 26px", border: "1.5px solid rgba(245,158,11,0.2)", boxShadow: "0 8px 32px rgba(120,53,15,0.08)" }}>
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
                  <span>{i.qty}x {i.name}</span><span>{money(i.price * i.qty)}</span>
                </div>
                {i.obs && <p style={{ fontSize: "0.78rem", color: "#9A8A7A", fontStyle: "italic", paddingLeft: 8 }}>→ {i.obs}</p>}
              </div>
            ))}
            <BreadDivider />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem", color: "#1C0A00" }}>
              <span>TOTAL</span><span>{money(localOrder.total)}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
            <a href="https://wa.me/5518991914512" target="_blank" rel="noopener noreferrer" className="btn-hover" style={{
              width: "100%", padding: "15px", borderRadius: 16,
              background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#FFFFFF",
              fontWeight: 700, textAlign: "center", display: "block", textDecoration: "none",
              boxShadow: "0 6px 20px rgba(37,211,102,0.3)"
            }}>📲 Enviar pelo WhatsApp</a>
            <button onClick={copyOrderDetails} className="btn-press" style={{
              width: "100%", padding: "13px", borderRadius: 16,
              background: "linear-gradient(135deg, #FEF3C7, #FDE68A)", color: "#78350F",
              fontWeight: 600, border: "1.5px solid rgba(245,158,11,0.3)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}>{copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar pedido</>}</button>
            <button onClick={() => { setStep("menu"); setOrderError(null); }} style={{
              width: "100%", padding: "11px", borderRadius: 16, background: "none",
              color: "#7A6B5D", fontSize: "0.9rem", border: "none", cursor: "pointer", fontWeight: 500
            }}>Tentar novamente</button>
          </div>
        </main>
      )}

      {/* FLOATING CART BUTTON */}
      {step === "menu" && itemCount > 0 && (
        <button onClick={() => setTicketOpen(true)} className="animate-slide-up btn-press" style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 18, padding: "16px 30px", borderRadius: 100,
          background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)",
          color: "#FFFFFF", border: "none", cursor: "pointer",
          boxShadow: "0 12px 40px rgba(245,158,11,0.45), 0 0 0 2px rgba(255,255,255,0.3) inset",
          zIndex: 30, whiteSpace: "nowrap", animation: "glow 3s ease-in-out infinite"
        }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={17} color="#FFFFFF" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
          <span style={{ width: 1.5, height: 24, background: "rgba(255,255,255,0.35)" }} />
          <span className="font-mono-ticket" style={{ fontWeight: 700, color: "#FFFFFF", fontSize: "1.05rem" }}>{money(total)}</span>
        </button>
      )}

      {/* CHAT FAB - Always visible on menu */}
      {step === "menu" && (
        <button onClick={() => { if (loggedIn) { setStep("conta"); setAccountTab("chat"); } else { setShowLoginModal(true); } }}
          className="chat-fab animate-fab-pulse"
          title="Conversar com a padaria"
          style={{ bottom: itemCount > 0 ? 100 : 28, transition: "bottom 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}>
          <MessageCircle size={26} color="#FFFFFF" />
        </button>
      )}

      {/* CART MODAL */}
      {ticketOpen && (
        <div className="animate-fade-in" style={{
          position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "flex-end", justifyContent: "center",
          background: "rgba(28,10,0,0.75)"
        }} onClick={(e) => { if (e.target === e.currentTarget) setTicketOpen(false); }}>
          <div className="animate-slide-up" style={{
            width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto",
            borderRadius: "28px 28px 0 0", background: "#FFFFFF", boxShadow: "0 -16px 56px rgba(0,0,0,0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
              <div style={{ width: 44, height: 5, borderRadius: 3, background: "linear-gradient(90deg, #F5D89A, #F59E0B)" }} />
            </div>
            <div style={{ padding: "14px 26px 30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #F97316)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(245,158,11,0.35)" }}>
                    <ShoppingBag size={20} color="#FFFFFF" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: "#1C0A00", fontSize: "1.05rem" }}>Seu Pedido</p>
                    <p style={{ fontSize: "0.78rem", color: "#9A8A7A" }}>{new Date().toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <button onClick={() => setTicketOpen(false)} className="btn-press" style={{
                  width: 40, height: 40, borderRadius: "50%", background: "#FEF3C7",
                  border: "1.5px solid rgba(245,158,11,0.2)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}><X size={16} color="#92400E" /></button>
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
                          <button onClick={() => removeItem(i.id)} className="btn-press" style={{ width: 28, height: 28, borderRadius: "50%", background: "#FEF3C7", border: "1.5px solid rgba(245,158,11,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Minus size={11} color="#92400E" />
                          </button>
                          <span className="font-mono-ticket" style={{ fontWeight: 700, fontSize: "1rem", width: 24, textAlign: "center", color: "#1C0A00" }}>{i.qty}</span>
                          <button onClick={() => addItem(i.id)} className="btn-press" style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #F97316)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Plus size={11} color="#FFFFFF" />
                          </button>
                        </div>
                        <span style={{ fontWeight: 600, color: "#1C0A00", fontSize: "0.92rem" }}>{i.name}</span>
                      </div>
                      <span className="font-mono-ticket" style={{ fontWeight: 700, color: "#DC2626", fontSize: "0.92rem" }}>{money(i.price * i.qty)}</span>
                    </div>
                    {i.has_obs && (cart[i.id] || 0) > 0 && (
                      <div style={{ marginTop: 8, paddingLeft: 47 }}>
                        <input type="text" value={cartObs[i.id] || ""} onChange={(e) => updateObs(i.id, e.target.value)} placeholder={i.obs_label || "Observação..."}
                          style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(245,158,11,0.2)", background: "#FFFBF5", color: "#1C0A00", fontSize: "0.85rem", boxSizing: "border-box" }} />
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
              <button onClick={() => { setTicketOpen(false); setStep("dados"); }} disabled={itemCount === 0} className="btn-press btn-hover" style={{
                width: "100%", padding: "16px", borderRadius: 16, marginTop: 6,
                background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)", backgroundSize: "200% 200%",
                animation: itemCount > 0 ? "gradientMove 3s ease infinite" : "none",
                color: "#FFFFFF", fontWeight: 800, fontSize: "1.05rem", border: "none",
                cursor: itemCount === 0 ? "not-allowed" : "pointer",
                boxShadow: "0 8px 28px rgba(245,158,11,0.35)", opacity: itemCount === 0 ? 0.4 : 1
              }}>✨ Continuar para os dados →</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="login-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
          <div className="login-modal">
            <div style={{ padding: "28px 28px 0", background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.03))", textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
                background: "linear-gradient(135deg, #F59E0B, #F97316)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(245,158,11,0.3)"
              }}><User size={28} color="#FFFFFF" /></div>
              <h2 className="font-display" style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1C0A00", marginBottom: 6 }}>Bem-vindo!</h2>
              <p style={{ fontSize: "0.88rem", color: "#7A6B5D", marginBottom: 24 }}>Crie sua conta para acompanhar seus pedidos.</p>
            </div>
            <div style={{ padding: "24px 28px 28px" }}>
              {loginError && (
                <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#DC2626", fontSize: "0.85rem", fontWeight: 500, textAlign: "center" }}>
                  {loginError}
                </div>
              )}
              <button onClick={handleGoogleLogin} disabled={loginLoading} className="social-btn" style={{ marginBottom: 20 }}>
                <GoogleIcon size={20} />
                {loginLoading ? "Conectando..." : "Continuar com Google"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
                <span style={{ fontSize: "0.78rem", color: "#9A8A7A", fontWeight: 500 }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <input type="text" placeholder="Seu nome" value={customer.nome} onChange={(e) => setCustomer({ ...customer, nome: e.target.value })}
                  style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: "1.5px solid rgba(245,158,11,0.2)", background: "#FFFBF5", color: "#1C0A00", fontSize: "0.95rem", marginBottom: 12, boxSizing: "border-box" }} />
                <input type="tel" placeholder="(18) 9XXXX-XXXX" value={customer.telefone} onChange={(e) => setCustomer({ ...customer, telefone: e.target.value })}
                  style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: "1.5px solid rgba(245,158,11,0.2)", background: "#FFFBF5", color: "#1C0A00", fontSize: "0.95rem", boxSizing: "border-box" }} />
              </div>
              <button onClick={handleLoginSave} disabled={!customer.nome || !customer.telefone} className="btn-hover" style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: "linear-gradient(135deg, #F59E0B, #F97316)", color: "#FFFFFF",
                fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer",
                boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
                opacity: !customer.nome || !customer.telefone ? 0.5 : 1
              }}>Criar conta / Entrar</button>
              <button onClick={() => setShowLoginModal(false)} style={{
                width: "100%", padding: "10px", marginTop: 10, background: "none", border: "none",
                color: "#9A8A7A", fontSize: "0.85rem", cursor: "pointer", fontWeight: 500
              }}>Entrar sem conta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT PANEL - Usado na aba "Minha Conta"
   ═══════════════════════════════════════════════ */
function ChatPanel({ customerName, customerPhone }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatSlug = customerPhone || null;

  const loadMessages = useCallback(async () => {
    if (!chatSlug) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("employee_slug", chatSlug)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  }, [chatSlug]);

  useEffect(() => {
    if (!chatSlug) return;
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [chatSlug, loadMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatSlug || !customerName?.trim()) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      order_id: null,
      employee_slug: chatSlug,
      sender: "customer",
      sender_name: customerName,
      message: newMsg.trim(),
    });
    if (error) console.error("Erro ao enviar:", error);
    setNewMsg("");
    setSending(false);
    await loadMessages();
  };

  const deleteMessage = async (msgId) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", msgId);
    if (error) console.error("Erro ao apagar mensagem:", error);
    else setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  if (!customerPhone) {
    return (
      <div className="text-center py-16">
        <MessageCircle size={48} color="#D4B896" style={{ margin: "0 auto 16px", opacity: 0.4 }} />
        <p style={{ color: "#7A6B5D", fontSize: "1rem", fontWeight: 600 }}>Faça login para acessar o chat</p>
        <p style={{ color: "#9A8A7A", fontSize: "0.88rem", marginTop: 8 }}>Entre com seu telefone para conversar com a padaria.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, overflow: "hidden", border: "1.5px solid rgba(37,211,102,0.15)", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
      {/* Chat header */}
      <div style={{
        padding: "16px 20px",
        background: "linear-gradient(135deg, #25D366, #128C7E)",
        color: "#FFFFFF", display: "flex", alignItems: "center", gap: 12
      }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageCircle size={18} />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Padaria da Rose</p>
          <p style={{ fontSize: "0.75rem", opacity: 0.85 }}>Atendimento online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} style={{
        height: 360, overflowY: "auto", padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 10,
        background: "#F0FFF4"
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <MessageCircle size={36} color="#25D366" style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ color: "#9A8A7A", fontSize: "0.9rem" }}>Envie uma mensagem para a padaria...</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender === "customer" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6 }}>
            {msg.sender === "customer" && (
              <button onClick={() => deleteMessage(msg.id)} title="Apagar mensagem" style={{
                width: 24, height: 24, borderRadius: "50%", border: "none", cursor: "pointer",
                background: "rgba(239,68,68,0.1)", color: "#EF4444",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: "0.7rem", opacity: 0.4, transition: "opacity 0.2s"
              }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}>✕</button>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 14px", borderRadius: 16,
              background: msg.sender === "customer"
                ? "linear-gradient(135deg, #25D366, #128C7E)"
                : "#FFFFFF",
              color: msg.sender === "customer" ? "#FFFFFF" : "#1C0A00",
              border: msg.sender === "customer" ? "none" : "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <p style={{ fontWeight: 600, fontSize: "0.72rem", marginBottom: 3, opacity: 0.7 }}>{msg.sender_name}</p>
              <p style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>{msg.message}</p>
              <p style={{ fontSize: "0.65rem", marginTop: 4, opacity: 0.5 }}>
                {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 8, background: "#FFFFFF" }}>
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Digite sua mensagem..."
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 12,
            border: "1.5px solid rgba(37,211,102,0.2)",
            background: "#F0FFF4", color: "#1C0A00", fontSize: "0.9rem", outline: "none"
          }}
        />
        <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #25D366, #128C7E)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: sending || !newMsg.trim() ? 0.5 : 1, transition: "all 0.2s"
          }}>
          <Send size={16} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}

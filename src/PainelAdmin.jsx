import React, { useState, useEffect, useRef } from "react";
import { Lock, LogOut, Package, ShoppingBag, Users, Plus, Trash2, Printer, Copy, Check, Wheat } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const money = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// som simples de notificação (beep) sem precisar de arquivo externo
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

export default function PainelAdmin() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("pedidos");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!session) return <TelaLogin />;

  return (
    <div className="min-h-screen" style={{ background: "#FAF4E6", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-ticket { font-family: 'IBM Plex Mono', monospace; }
        @media print {
          body * { visibility: hidden; }
          .comanda-print, .comanda-print * { visibility: visible; }
          .comanda-print { position: fixed; top: 0; left: 0; width: 280px; }
        }
      `}</style>

      <header className="flex items-center justify-between px-6 py-4" style={{ 
        background: "linear-gradient(135deg, #1a0f0a, #2D1810)",
        borderBottom: "1px solid rgba(232, 195, 106, 0.15)"
      }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden" style={{
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)"
          }}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" style={{ mixBlendMode: "multiply" }} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: "#FFF8F0" }}>
              Painel · Padaria <span style={{ color: "#E8C36A" }}>da Rose</span>
            </h1>
            <p className="text-xs" style={{ color: "#A0896E" }}>Gerenciamento de pedidos</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105" style={{ 
          background: "rgba(232, 195, 106, 0.1)", 
          color: "#E8C36A",
          border: "1px solid rgba(232, 195, 106, 0.2)"
        }}>
          <LogOut size={15} /> Sair
        </button>
      </header>

      <nav className="flex gap-3 px-6 py-5 max-w-6xl mx-auto">
        {[
          { id: "pedidos", label: "Pedidos", icon: ShoppingBag },
          { id: "produtos", label: "Produtos", icon: Package },
          { id: "funcionarios", label: "Funcionários", icon: Users },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
              style={{ 
                background: active ? "linear-gradient(135deg, #2D1810, #4A2C1A)" : "#FFFFFF", 
                color: active ? "#FCF6F0" : "#5C3D2E", 
                border: "1px solid",
                borderColor: active ? "transparent" : "rgba(212, 160, 74, 0.15)",
                boxShadow: active ? "0 4px 16px rgba(45, 24, 16, 0.25)" : "0 2px 8px rgba(0,0,0,0.04)"
              }}>
              <Icon size={16} />{t.label}
            </button>
          );
        })}
      </nav>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        {tab === "pedidos" && <AbaPedidos />}
        {tab === "produtos" && <AbaProdutos />}
        {tab === "funcionarios" && <AbaFuncionarios />}
      </main>
    </div>
  );
}

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ 
      background: "linear-gradient(180deg, #1a0f0a 0%, #2D1810 100%)",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full mx-auto overflow-hidden mb-4" style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
          }}>
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" style={{ mixBlendMode: "multiply" }} />
          </div>
          <h2 className="font-display text-2xl font-bold" style={{ color: "#FFF8F0" }}>Painel da Rose</h2>
        </div>
        <form onSubmit={entrar} className="p-8 rounded-2xl" style={{ 
          background: "#FDFBF8",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.3)"
        }}>
          <div className="flex items-center gap-2 mb-6" style={{ color: "#5C3D2E" }}>
            <Lock size={18} />
            <span className="text-xs uppercase tracking-widest font-semibold">Acesso restrito</span>
          </div>
          <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "#5C3D2E" }}>E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full mb-5 px-4 py-3.5 rounded-xl outline-none transition-all text-sm" style={{ 
              border: "1px solid rgba(212, 160, 74, 0.2)", 
              background: "#FFFFFF",
              color: "#2D1810"
            }} 
            onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
            onBlur={(e) => e.target.style.borderColor = "rgba(212, 160, 74, 0.2)"}
            placeholder="seu@email.com" />
          <label className="text-xs font-semibold uppercase tracking-wide block mb-2" style={{ color: "#5C3D2E" }}>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required
            className="w-full mb-6 px-4 py-3.5 rounded-xl outline-none transition-all text-sm" style={{ 
              border: "1px solid rgba(212, 160, 74, 0.2)", 
              background: "#FFFFFF",
              color: "#2D1810"
            }}
            onFocus={(e) => e.target.style.borderColor = "#D4A04A"}
            onBlur={(e) => e.target.style.borderColor = "rgba(212, 160, 74, 0.2)"}
            placeholder="Sua senha" />
          {erro && <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: "rgba(184, 74, 74, 0.08)", color: "#B84A4A" }}>{erro}</p>}
          <button disabled={carregando} type="submit" className="w-full py-4 rounded-xl font-semibold text-base transition-all" style={{ 
            background: "linear-gradient(135deg, #2D1810, #4A2C1A)", 
            color: "#FCF6F0",
            boxShadow: "0 4px 16px rgba(45, 24, 16, 0.3)"
          }}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AbaPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const printRef = useRef(null);
  const [pedidoParaImprimir, setPedidoParaImprimir] = useState(null);

  const carregarPedidos = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(30);
    setPedidos(data || []);
  };

  useEffect(() => {
    carregarPedidos();
    const canal = supabase
      .channel("pedidos-novos")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, async (payload) => {
        playBeep();
        await carregarPedidos();
        setPedidoParaImprimir(payload.new.id);
      })
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  useEffect(() => {
    if (pedidoParaImprimir) {
      // dá um tempinho para os itens do pedido chegarem antes de imprimir
      setTimeout(() => window.print(), 600);
    }
  }, [pedidoParaImprimir]);

  const mudarStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    carregarPedidos();
  };

  const pedidoImpresso = pedidos.find((p) => p.id === pedidoParaImprimir);

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#5B6B62" }}>
        Deixe esta aba aberta no computador da padaria — cada novo pedido toca um som e imprime a comanda automaticamente.
      </p>
      <div className="space-y-3">
        {pedidos.map((p) => (
          <div key={p.id} className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #16332A1A" }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold" style={{ color: "#16332A" }}>#{p.id} — {p.customer_name}</p>
                <p className="text-xs" style={{ color: "#5B6B62" }}>{p.customer_phone} · retirada: {p.pickup_time}</p>
                {p.employee_slug && <p className="text-xs font-mono-ticket" style={{ color: "#8B4A2B" }}>via link: {p.employee_slug}</p>}
              </div>
              <button onClick={() => { setPedidoParaImprimir(p.id); setTimeout(() => window.print(), 200); }} className="p-2 rounded-lg" style={{ background: "#16332A0F", color: "#16332A" }}>
                <Printer size={15} />
              </button>
            </div>
            <div className="mt-2 text-sm space-y-1">
              {(p.order_items || []).map((it) => (
                <div key={it.id} className="flex justify-between" style={{ color: "#5B6B62" }}>
                  <span>{it.qty}x {it.product_name}</span><span>{money(it.unit_price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="font-mono-ticket font-semibold" style={{ color: "#16332A" }}>{money(p.total)}</span>
              <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)} className="text-sm px-2 py-1 rounded-lg" style={{ border: "1px solid #16332A33" }}>
                <option value="novo">Novo</option>
                <option value="preparando">Preparando</option>
                <option value="pronto">Pronto</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        ))}
        {pedidos.length === 0 && <p style={{ color: "#5B6B62" }}>Nenhum pedido ainda.</p>}
      </div>

      {/* área invisível na tela, usada só na hora de imprimir */}
      {pedidoImpresso && (
        <div ref={printRef} className="comanda-print font-mono-ticket" style={{ display: "none" }}>
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

function AbaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [novo, setNovo] = useState({ name: "", description: "", price: "", unit: "unid.", category: "paes" });

  const carregar = async () => {
    const { data } = await supabase.from("products").select("*").order("category");
    setProdutos(data || []);
  };
  useEffect(() => { carregar(); }, []);

  const adicionar = async (e) => {
    e.preventDefault();
    await supabase.from("products").insert({ ...novo, price: Number(novo.price) });
    setNovo({ name: "", description: "", price: "", unit: "unid.", category: "paes" });
    carregar();
  };

  const alternarDisponibilidade = async (p) => {
    await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    carregar();
  };

  const remover = async (id) => {
    await supabase.from("products").delete().eq("id", id);
    carregar();
  };

  const atualizarPreco = async (id, price) => {
    await supabase.from("products").update({ price: Number(price) }).eq("id", id);
  };

  return (
    <div>
      <form onSubmit={adicionar} className="grid sm:grid-cols-6 gap-2 mb-6 p-4 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #16332A1A" }}>
        <input required placeholder="Nome" value={novo.name} onChange={(e) => setNovo({ ...novo, name: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg" style={{ border: "1px solid #16332A33" }} />
        <input placeholder="Descrição" value={novo.description} onChange={(e) => setNovo({ ...novo, description: e.target.value })} className="sm:col-span-2 px-3 py-2 rounded-lg" style={{ border: "1px solid #16332A33" }} />
        <input required type="number" step="0.01" placeholder="Preço" value={novo.price} onChange={(e) => setNovo({ ...novo, price: e.target.value })} className="px-3 py-2 rounded-lg" style={{ border: "1px solid #16332A33" }} />
        <select value={novo.category} onChange={(e) => setNovo({ ...novo, category: e.target.value })} className="px-3 py-2 rounded-lg" style={{ border: "1px solid #16332A33" }}>
          <option value="paes">Pães</option>
          <option value="domingo">Domingo</option>
          <option value="bolos">Bolos & Doces</option>
        </select>
        <button type="submit" className="sm:col-span-6 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5" style={{ background: "#16332A", color: "#FAF4E6" }}>
          <Plus size={15} /> Adicionar produto
        </button>
      </form>

      <div className="space-y-2">
        {produtos.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #16332A1A" }}>
            <span className="font-medium flex-1 min-w-[140px]" style={{ color: "#16332A" }}>{p.name}</span>
            <input defaultValue={p.price} type="number" step="0.01" onBlur={(e) => atualizarPreco(p.id, e.target.value)} className="w-24 px-2 py-1 rounded-lg text-sm" style={{ border: "1px solid #16332A33" }} />
            <button onClick={() => alternarDisponibilidade(p)} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: p.available ? "#16332A" : "#A63D401A", color: p.available ? "#FAF4E6" : "#A63D40" }}>
              {p.available ? "Disponível" : "Indisponível"}
            </button>
            <button onClick={() => remover(p.id)} className="p-2 rounded-lg" style={{ color: "#A63D40" }}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <p className="text-xs mt-3" style={{ color: "#5B6B62" }}>
        Fotos de produtos: para trocar a imagem, use o Storage do Supabase e cole o link gerado no campo image_url (posso montar esse upload direto aqui depois, se preferir).
      </p>
    </div>
  );
}

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
    await supabase.from("employees").delete().eq("id", id);
    carregar();
  };

  const copiarLink = (slug) => {
    const link = `${window.location.origin.replace("/admin", "")}/?func=${slug}`;
    navigator.clipboard.writeText(link);
    setCopiado(slug);
    setTimeout(() => setCopiado(null), 1500);
  };

  return (
    <div>
      <form onSubmit={adicionar} className="flex gap-2 mb-6">
        <input required placeholder="Nome do funcionário" value={nome} onChange={(e) => setNome(e.target.value)} className="flex-1 px-3 py-2 rounded-lg" style={{ border: "1px solid #16332A33" }} />
        <button type="submit" className="px-4 py-2 rounded-lg font-medium" style={{ background: "#16332A", color: "#FAF4E6" }}>Adicionar</button>
      </form>
      <div className="space-y-2">
        {funcionarios.map((f) => (
          <div key={f.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#FFFFFF", border: "1px solid #16332A1A" }}>
            <span className="font-medium" style={{ color: "#16332A" }}>{f.name}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => copiarLink(f.slug)} className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1" style={{ background: "#16332A0F", color: "#16332A" }}>
                {copiado === f.slug ? <Check size={13} /> : <Copy size={13} />} link
              </button>
              <button onClick={() => remover(f.id)} className="p-2 rounded-lg" style={{ color: "#A63D40" }}><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

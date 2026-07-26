require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const net = require("net");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const CONFIG_PATH = path.join(__dirname, "config.json");

function carregarConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return { mode: "nenhuma" };
  }
}
function salvarConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

const status = { conectadoSupabase: false, ultimoPedido: null };

app.get("/api/impressoras/windows", (req, res) => {
  exec(
    'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"',
    (err, stdout) => {
      if (err) return res.json({ impressoras: [] });
      const nomes = stdout.split("\n").map((s) => s.trim()).filter(Boolean);
      res.json({ impressoras: nomes });
    }
  );
});

app.get("/api/impressoras/rede/scan", async (req, res) => {
  const ifaces = os.networkInterfaces();
  let base = null;
  for (const nome in ifaces) {
    for (const i of ifaces[nome]) {
      if (i.family === "IPv4" && !i.internal) base = i.address.split(".").slice(0, 3).join(".");
    }
  }
  if (!base) return res.json({ encontrados: [] });

  const testar = (ip) =>
    new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(300);
      socket.once("connect", () => { socket.destroy(); resolve(ip); });
      socket.once("error", () => resolve(null));
      socket.once("timeout", () => { socket.destroy(); resolve(null); });
      socket.connect(9100, ip);
    });

  const testes = [];
  for (let i = 1; i <= 254; i++) testes.push(testar(`${base}.${i}`));
  const resultados = (await Promise.all(testes)).filter(Boolean);
  res.json({ encontrados: resultados });
});

app.get("/api/configuracao", (req, res) => res.json(carregarConfig()));
app.post("/api/configuracao", (req, res) => {
  salvarConfig(req.body);
  res.json({ ok: true });
});

app.get("/api/status", (req, res) => res.json(status));

function beep() {
  exec(
    'powershell -NoProfile -Command "[console]::beep(1000,120); Start-Sleep -m 80; [console]::beep(1000,250)"'
  );
}

function money(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ──────────────────────────────────────────────────
// TANCA TP-550 ESC/POS formatting
// ──────────────────────────────────────────────────
function centralizar(texto, largura = 48) {
  const len = texto.length;
  if (len >= largura) return texto;
  const espacos = Math.floor((largura - len) / 2);
  return " ".repeat(espacos) + texto;
}

function divisor(largura = 48) {
  return "-".repeat(largura);
}

function montarTexto(pedido, itens) {
  const LARGURA = 48; // TANCA TP-550 supports 48/32 columns
  const linhas = [];
  
  // Header centralizado
  linhas.push("");
  linhas.push("PADARIA DA ROSE");
  linhas.push(`Pedido #${pedido.id}`);
  linhas.push(new Date(pedido.created_at).toLocaleString("pt-BR"));
  linhas.push(divisor(LARGURA));
  
  // Dados do cliente
  linhas.push(`Cliente: ${pedido.customer_name}`);
  linhas.push(`Telefone: ${pedido.customer_phone}`);
  linhas.push(`Retirada: ${pedido.pickup_time || "-"}`);
  if (pedido.employee_slug) linhas.push(`Atendido via: ${pedido.employee_slug}`);
  linhas.push(divisor(LARGURA));
  
  // Itens do pedido
  for (const it of itens) {
    const nome = it.product_name;
    const qtdPreco = `${it.qty}x ${money(it.unit_price * it.qty)}`;
    
    if (nome.length + qtdPreco.length + 3 > LARGURA) {
      linhas.push(`${it.qty}x ${nome}`);
      linhas.push(`   ${money(it.unit_price * it.qty)}`);
    } else {
      const espacoNecessario = LARGURA - nome.length - qtdPreco.length;
      linhas.push(`${nome}${" ".repeat(Math.max(1, espacoNecessario))}${qtdPreco}`);
    }
    
    // Observação do item
    if (it.observation && it.observation.trim()) {
      linhas.push(`   Obs: ${it.observation}`);
    }
  }
  
  linhas.push(divisor(LARGURA));
  linhas.push(`TOTAL: ${money(pedido.total)}`);
  
  if (pedido.notes && pedido.notes.trim()) {
    linhas.push(divisor(LARGURA));
    linhas.push(`Obs: ${pedido.notes}`);
  }
  
  linhas.push("");
  linhas.push("");
  linhas.push("");
  
  return linhas.join("\n");
}

function imprimirWindows(texto, printerName) {
  const tmp = path.join(os.tmpdir(), `comanda-${Date.now()}.txt`);
  fs.writeFileSync(tmp, texto, "latin1");
  exec(`print /D:"${printerName}" "${tmp}"`, (err) => {
    if (err) console.error("Erro ao imprimir:", err.message);
    fs.unlink(tmp, () => {});
  });
}

function imprimirRede(texto, ip, port) {
  // TANCA TP-550 ESC/POS commands
  const INICIO = "\x1B@";           // Initialize printer
  const LARGURA_COLUNAS = "\x1Bc\x01\x00"; // Set page width (80mm)
  const CORTE = "\x1D\x56\x00";     // Cut paper (full cut)
  const ALINHAR_CENTRO = "\x1B\x61\x01"; // Center alignment
  const ALINHAR_ESQUERDA = "\x1B\x61\x00"; // Left alignment
  const NEGLITO_ON = "\x1B\x45\x01"; // Bold on
  const NEGLITO_OFF = "\x1B\x45\x00"; // Bold off
  const TAMANHO_NORMAL = "\x1D\x21\x00"; // Normal size
  const TAMANHO_DUPLO = "\x1B\x21\x30"; // Double height+width
  
  // Build the formatted receipt
  let conteudo = "";
  
  // Initialize
  conteudo += INICIO;
  conteudo += LARGURA_COLUNAS;
  
  // Header - centered, bold, double size
  conteudo += ALINHAR_CENTRO;
  conteudo += NEGLITO_ON;
  conteudo += TAMANHO_DUPLO;
  conteudo += "PADARIA DA ROSE";
  conteudo += TAMANHO_NORMAL;
  conteudo += "\n";
  conteudo += NEGLITO_OFF;
  
  // Order number and date
  conteudo += `Pedido #${texto.match(/Pedido #(\d+)/)?.[1] || ""}`;
  conteudo += "\n";
  const dataMatch = texto.match(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/);
  if (dataMatch) conteudo += dataMatch[0] + "\n";
  conteudo += ALINHAR_ESQUERDA;
  conteudo += "\x1B\x2D\x01"; // Underline on (thin)
  conteudo += " ".repeat(48);
  conteudo += "\x1B\x2D\x00"; // Underline off
  conteudo += "\n";
  
  // Parse and format the rest of the receipt
  const linhas = texto.split("\n");
  let skipHeader = true;
  
  for (const linha of linhas) {
    const trimmed = linha.trim();
    
    // Skip already-processed header lines
    if (skipHeader) {
      if (trimmed.startsWith("PADARIA") || trimmed.startsWith("Pedido #") || 
          trimmed.match(/^\d{2}\/\d{2}\/\d{4}/) || trimmed === "") {
        continue;
      }
      skipHeader = false;
    }
    
    // Divider line
    if (trimmed.match(/^-{10,}$/)) {
      conteudo += "\x1B\x2D\x01"; // Underline on
      conteudo += " ".repeat(48);
      conteudo += "\x1B\x2D\x00"; // Underline off
      conteudo += "\n";
      continue;
    }
    
    // TOTAL line - bold
    if (trimmed.startsWith("TOTAL:")) {
      conteudo += NEGLITO_ON;
      conteudo += TAMANHO_DUPLO;
      conteudo += trimmed;
      conteudo += TAMANHO_NORMAL;
      conteudo += NEGLITO_OFF;
      conteudo += "\n";
      continue;
    }
    
    // Normal line
    conteudo += trimmed;
    conteudo += "\n";
  }
  
  // Feed and cut
  conteudo += "\n\n\n";
  conteudo += CORTE;
  
  const socket = new net.Socket();
  socket.connect(port || 9100, ip, () => {
    socket.write(Buffer.from(conteudo, "binary"));
    socket.end();
    console.log(`Pedido #${texto.match(/Pedido #(\d+)/)?.[1]} impresso com sucesso!`);
  });
  socket.on("error", (err) => console.error("Erro ao imprimir:", err.message));
}

async function processarPedido(supabase, pedidoId) {
  const { data: pedido } = await supabase.from("orders").select("*").eq("id", pedidoId).single();
  const { data: itens } = await supabase.from("order_items").select("*").eq("order_id", pedidoId);
  if (!pedido) return;

  beep();
  status.ultimoPedido = { id: pedido.id, hora: new Date().toLocaleTimeString("pt-BR") };

  const cfg = carregarConfig();
  const texto = montarTexto(pedido, itens || []);
  
  console.log("=== COMANDA ===");
  console.log(texto);
  console.log("===============");
  
  if (cfg.mode === "windows" && cfg.printerName) {
    imprimirWindows(texto, cfg.printerName);
  } else if (cfg.mode === "network" && cfg.ip) {
    imprimirRede(texto, cfg.ip, cfg.port);
  }
}

async function iniciarSupabase() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  if (error) {
    console.error("Não foi possível entrar no Supabase. Confira o arquivo .env");
    return;
  }
  status.conectadoSupabase = true;
  console.log("Conectado ao Supabase! Aguardando pedidos...");
  
  supabase
    .channel("impressora-local")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
      console.log("Novo pedido recebido:", payload.new.id);
      processarPedido(supabase, payload.new.id);
    })
    .subscribe();
}

iniciarSupabase();

const PORTA = 4000;
app.listen(PORTA, () => console.log(`Configuração da impressora em: http://localhost:${PORTA}`));

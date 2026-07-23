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
    return { mode: "nenhuma" }; // "nenhuma" | "windows" | "network"
  }
}
function salvarConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

const status = { conectadoSupabase: false, ultimoPedido: null };

// ---------------------------------------------------------
// Detectar impressoras instaladas no Windows
// ---------------------------------------------------------
app.get("/api/impressoras/windows", (req, res) => {
  exec(
    'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"',
    (err, stdout) => {
      if (err) return res.json({ impressoras: [] });
      const nomes = stdout
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      res.json({ impressoras: nomes });
    }
  );
});

// ---------------------------------------------------------
// Procurar impressoras de rede (testa a porta 9100 na sua rede local)
// ---------------------------------------------------------
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
      socket.once("connect", () => {
        socket.destroy();
        resolve(ip);
      });
      socket.once("error", () => resolve(null));
      socket.once("timeout", () => {
        socket.destroy();
        resolve(null);
      });
      socket.connect(9100, ip);
    });

  const testes = [];
  for (let i = 1; i <= 254; i++) testes.push(testar(`${base}.${i}`));
  const resultados = (await Promise.all(testes)).filter(Boolean);
  res.json({ encontrados: resultados });
});

// ---------------------------------------------------------
// Configuração escolhida (salva localmente, sem editar arquivos)
// ---------------------------------------------------------
app.get("/api/configuracao", (req, res) => res.json(carregarConfig()));
app.post("/api/configuracao", (req, res) => {
  salvarConfig(req.body);
  res.json({ ok: true });
});

app.get("/api/status", (req, res) => res.json(status));

// ---------------------------------------------------------
// Som + impressão quando chega pedido novo
// ---------------------------------------------------------
function beep() {
  exec(
    'powershell -NoProfile -Command "[console]::beep(1000,120); Start-Sleep -m 80; [console]::beep(1000,250)"'
  );
}

function money(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function montarTexto(pedido, itens) {
  const linhas = [];
  linhas.push("PADARIA DA ROSE");
  linhas.push(`Pedido #${pedido.id}`);
  linhas.push(new Date(pedido.created_at).toLocaleString("pt-BR"));
  linhas.push(`Cliente: ${pedido.customer_name}`);
  linhas.push(`Telefone: ${pedido.customer_phone}`);
  linhas.push(`Retirada: ${pedido.pickup_time || "-"}`);
  if (pedido.employee_slug) linhas.push(`Atendido via link: ${pedido.employee_slug}`);
  linhas.push("--------------------------------");
  for (const it of itens) linhas.push(`${it.qty}x ${it.product_name}  ${money(it.unit_price * it.qty)}`);
  linhas.push("--------------------------------");
  linhas.push(`TOTAL: ${money(pedido.total)}`);
  if (pedido.notes) linhas.push(`Obs: ${pedido.notes}`);
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
  const conteudo = "\x1B@" + texto + "\n\n\n" + "\x1DV\x00";
  const socket = new net.Socket();
  socket.connect(port || 9100, ip, () => {
    socket.write(Buffer.from(conteudo, "latin1"));
    socket.end();
  });
  socket.on("error", (err) => console.error("Erro ao imprimir:", err.message));
}

async function processarPedido(supabase, pedidoId) {
  const { data: pedido } = await supabase.from("orders").select("*").eq("id", pedidoId).single();
  const { data: itens } = await supabase.from("order_items").select("*").eq("order_id", pedidoId);
  if (!pedido) return;

  beep(); // toca sempre, com ou sem impressora — assim vocês ouvem o pedido chegar
  status.ultimoPedido = { id: pedido.id, hora: new Date().toLocaleTimeString("pt-BR") };

  const cfg = carregarConfig();
  const texto = montarTexto(pedido, itens || []);
  if (cfg.mode === "windows" && cfg.printerName) imprimirWindows(texto, cfg.printerName);
  else if (cfg.mode === "network" && cfg.ip) imprimirRede(texto, cfg.ip, cfg.port);
  // se cfg.mode === "nenhuma": não imprime nada — o pedido já está visível no painel administrador
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
  supabase
    .channel("impressora-local")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
      processarPedido(supabase, payload.new.id);
    })
    .subscribe();
}

iniciarSupabase();

const PORTA = 4000;
app.listen(PORTA, () => console.log(`Configuração da impressora em: http://localhost:${PORTA}`));

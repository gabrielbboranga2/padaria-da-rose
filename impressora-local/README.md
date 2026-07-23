# Impressora automática — Padaria da Rose

Este programinha fica rodando no computador da padaria. Ele **não hospeda nada** e **não abre nenhuma porta** —
só se conecta para fora, ao Supabase, e fica esperando novos pedidos. Quando chega um, toca um som e (se você
tiver configurado uma impressora) imprime a comanda sozinho.

**Sem impressora conectada, os pedidos continuam aparecendo normalmente na aba "Pedidos" do painel administrador**,
com som — a impressora é só um complemento para quem já tem uma.

## 1. Instalar o Node.js (só uma vez)

1. Baixe em https://nodejs.org (versão **LTS**).
2. Instale clicando em "Avançar" até o fim.

## 2. Configurar as credenciais

1. Copie o arquivo `.env.example` e renomeie a cópia para `.env`.
2. Preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` (Project Settings > API no Supabase — os mesmos do site) e
   `ADMIN_EMAIL` / `ADMIN_PASSWORD` (o mesmo login do painel administrador).

Repare que **não tem mais nada sobre impressora aqui** — isso agora é configurado numa telinha, no passo 4.

## 3. Rodar

No Prompt de Comando, dentro da pasta `impressora-local`:

```
npm install
npm start
```

Vai aparecer algo como `Configuração da impressora em: http://localhost:4000`.

## 4. Escolher a impressora (ou nenhuma)

Abra o navegador e acesse **http://localhost:4000**. Lá você escolhe uma das três opções:

- **Sem impressora** — os pedidos só vão aparecer e tocar som no painel administrador e nesta telinha.
- **Impressora instalada no Windows** — a página já lista automaticamente as impressoras que aparecem em
  "Dispositivos e Impressoras"; basta escolher e salvar.
- **Impressora de rede** — clique em "Procurar na rede" para ela detectar sozinha, ou digite o IP manualmente.

Pode voltar nessa página quando quiser para trocar a escolha — não precisa mexer em nenhum arquivo.

## 5. Deixar rodando sempre (inicia sozinho com o Windows)

1. Aperte `Windows + R`, digite `shell:startup` e Enter.
2. Crie um arquivo `iniciar.bat` com:
   ```
   cd /d "CAMINHO_COMPLETO_DA_PASTA\impressora-local"
   npm start
   ```
3. Coloque um atalho desse `iniciar.bat` na pasta que abriu no passo 1.

## Importante

- Mantenha o `.env` só nesse computador — ele guarda a senha do painel.
- A página http://localhost:4000 só é vista por quem está usando esse computador da padaria — ninguém de fora acessa.
- Se quiser reimprimir uma comanda específica manualmente, o botão de impressora no painel administrador (no navegador) continua funcionando.

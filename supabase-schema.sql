-- ============================================================
-- PADARIA DA ROSE — schema do Supabase
-- Rode este arquivo inteiro em: Supabase > SQL Editor > New query > Run
-- ============================================================

-- extensão para gerar IDs únicos
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- PRODUTOS
-- ------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  unit text default 'unid.',
  category text not null, -- 'paes' | 'domingo' | 'bolos'
  available boolean not null default true,
  image_url text,
  has_obs boolean not null default false,
  obs_label text default 'Observação',
  created_at timestamptz not null default now()
);

alter table products enable row level security;

-- qualquer visitante pode ver produtos DISPONÍVEIS (site dos clientes)
create policy "produtos disponiveis sao publicos"
  on products for select
  to anon
  using (available = true);

-- o administrador logado vê todos (disponíveis ou não) e pode editar
create policy "admin ve tudo"
  on products for select
  to authenticated
  using (true);

create policy "admin gerencia produtos"
  on products for all
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- FUNCIONÁRIOS (cada um com um link próprio, ex: /?func=joao)
-- ------------------------------------------------------------
create table employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique, -- usado na url, ex: "joao"
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table employees enable row level security;

create policy "admin gerencia funcionarios"
  on employees for all
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
create table orders (
  id bigint generated always as identity primary key,
  customer_name text not null,
  customer_phone text not null,
  pickup_time text,
  notes text,
  employee_slug text, -- de qual link o cliente veio (pode ser nulo)
  status text not null default 'novo', -- novo | preparando | pronto | entregue | cancelado
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

-- qualquer cliente pode CRIAR um pedido (mas não ler os pedidos de outros)
create policy "clientes podem criar pedidos"
  on orders for insert
  to anon
  with check (true);

-- admin logado também pode criar pedidos (caso a sessão esteja ativa no browser)
create policy "authenticated pode criar pedidos"
  on orders for insert
  to authenticated
  with check (true);

-- só o administrador logado pode ver e atualizar pedidos
create policy "admin ve e atualiza pedidos"
  on orders for select
  to authenticated
  using (true);

create policy "admin atualiza pedidos"
  on orders for update
  to authenticated
  using (true)
  with check (true);

-- admin pode deletar pedidos
create policy "admin pode deletar pedidos"
  on orders for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- ITENS DO PEDIDO
-- ------------------------------------------------------------
create table order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_name text not null,
  qty int not null default 1,
  unit_price numeric(10,2) not null default 0,
  observation text default ''
);

alter table order_items enable row level security;

create policy "clientes podem criar itens do pedido"
  on order_items for insert
  to anon
  with check (true);

-- admin logado também pode criar itens
create policy "authenticated pode criar itens do pedido"
  on order_items for insert
  to authenticated
  with check (true);

create policy "admin ve itens do pedido"
  on order_items for select
  to authenticated
  using (true);

-- admin pode deletar itens
create policy "admin pode deletar itens do pedido"
  on order_items for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- CHAT CLIENTE ↔ VENDEDOR
-- ------------------------------------------------------------
create table chat_messages (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete set null,
  employee_slug text not null,
  sender text not null, -- 'customer' | 'seller'
  sender_name text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "clientes podem enviar mensagem"
  on chat_messages for insert
  to anon
  with check (true);

create policy "authenticated pode enviar mensagem"
  on chat_messages for insert
  to authenticated
  with check (true);

create policy "anon pode ler mensagens"
  on chat_messages for select
  to anon
  using (true);

create policy "authenticated pode ler mensagens"
  on chat_messages for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- LIGAR O TEMPO REAL (para o som + impressão automática no admin)
-- ------------------------------------------------------------
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table chat_messages;

-- ------------------------------------------------------------
-- Alguns produtos de exemplo (apague depois de cadastrar os reais)
-- ------------------------------------------------------------
insert into products (name, description, price, unit, category, available, has_obs, obs_label) values
  ('Pão francês', 'Casquinha crocante, feito na hora', 1.00, 'unid.', 'paes', true, false, 'Observação'),
  ('Pão de queijo', 'Receita da casa, forno a lenha', 2.50, 'unid.', 'paes', true, false, 'Observação'),
  ('Pão de brioche', 'Macio e amanteigado, sob encomenda', 12.00, 'unid.', 'paes', true, false, 'Observação'),
  ('Pão de hambúrguer', 'Vendido em pacotes de 4', 14.00, 'pacote', 'paes', true, false, 'Observação'),
  ('Pão caseiro', 'Pão grande de forma, receita tradicional', 10.00, 'unid.', 'paes', false, false, 'Observação'),
  ('Costela assada', 'Somente aos domingos', 45.00, 'kg', 'domingo', true, true, 'Como deseja a costela?'),
  ('Frango assado', 'Temperado e assado no forno da casa', 32.00, 'unid.', 'domingo', true, false, 'Observação'),
  ('Porco assado', 'Somente aos domingos', 48.00, 'kg', 'domingo', true, true, 'Como deseja o porco?'),
  ('Bolo de chocolate', 'Fatia generosa ou bolo inteiro', 8.00, 'fatia', 'bolos', true, true, 'Fatia ou bolo inteiro?'),
  ('Docinhos variados', 'Brigadeiro, beijinho e cajuzinho — caixa com 12', 18.00, 'caixa', 'bolos', true, false, 'Observação');

-- ============================================================
-- DEPOIS DE RODAR ESTE ARQUIVO:
-- 1. Vá em Authentication > Users > Add user, e crie o login do
--    administrador (o e-mail e a senha da padaria).
-- 2. Vá em Database > Replication e confirme que "orders" e
--    "order_items" estão marcados para Realtime (o comando acima
--    já faz isso, mas vale conferir).
-- ============================================================

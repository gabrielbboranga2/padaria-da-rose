-- ============================================================
-- REPARO COMPLETO — Padaria da Rose
-- Cole TUDO isso no Supabase > SQL Editor > New query > Run
-- ============================================================

-- ── PRODUCTS ─────────────────────────────────────────────────
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "produtos disponiveis sao publicos" ON products;
DROP POLICY IF EXISTS "admin ve tudo" ON products;
DROP POLICY IF EXISTS "admin gerencia produtos" ON products;

CREATE POLICY "produtos disponiveis sao publicos"
  ON products FOR SELECT TO anon
  USING (available = true);

CREATE POLICY "admin ve tudo"
  ON products FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin gerencia produtos"
  ON products FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── EMPLOYEES ────────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin gerencia funcionarios" ON employees;
DROP POLICY IF EXISTS "anon ve funcionarios ativos" ON employees;

CREATE POLICY "anon ve funcionarios ativos"
  ON employees FOR SELECT TO anon
  USING (active = true);

CREATE POLICY "admin gerencia funcionarios"
  ON employees FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── ORDERS ──────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes podem criar pedidos" ON orders;
DROP POLICY IF EXISTS "authenticated pode criar pedidos" ON orders;
DROP POLICY IF EXISTS "admin ve e atualiza pedidos" ON orders;
DROP POLICY IF EXISTS "admin atualiza pedidos" ON orders;
DROP POLICY IF EXISTS "admin pode deletar pedidos" ON orders;

CREATE POLICY "clientes podem criar pedidos"
  ON orders FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated pode criar pedidos"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admin ve e atualiza pedidos"
  ON orders FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin atualiza pedidos"
  ON orders FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "admin pode deletar pedidos"
  ON orders FOR DELETE TO authenticated
  USING (true);

-- ── ORDER ITEMS ──────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes podem criar itens do pedido" ON order_items;
DROP POLICY IF EXISTS "authenticated pode criar itens do pedido" ON order_items;
DROP POLICY IF EXISTS "admin ve itens do pedido" ON order_items;
DROP POLICY IF EXISTS "admin pode deletar itens do pedido" ON order_items;

CREATE POLICY "clientes podem criar itens do pedido"
  ON order_items FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated pode criar itens do pedido"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "admin ve itens do pedido"
  ON order_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "admin pode deletar itens do pedido"
  ON order_items FOR DELETE TO authenticated
  USING (true);

-- ── REALTIME ─────────────────────────────────────────────────
-- (seguro rodar mesmo se ja estiver ativo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;
END $$;

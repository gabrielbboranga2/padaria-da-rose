-- Corrigir políticas RLS que estão bloqueando inserções
-- Rode no Supabase > SQL Editor > New query > Run

-- Orders: permitir que clientes anônimos criem pedidos
DROP POLICY IF EXISTS "clientes podem criar pedidos" ON orders;
CREATE POLICY "clientes podem criar pedidos"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- Orders: admin logado também pode criar pedidos
DROP POLICY IF EXISTS "authenticated pode criar pedidos" ON orders;
CREATE POLICY "authenticated pode criar pedidos"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Orders: admin pode ver tudo
DROP POLICY IF EXISTS "admin ve e atualiza pedidos" ON orders;
CREATE POLICY "admin ve e atualiza pedidos"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- Orders: admin pode atualizar
DROP POLICY IF EXISTS "admin atualiza pedidos" ON orders;
CREATE POLICY "admin atualiza pedidos"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Orders: admin pode deletar
DROP POLICY IF EXISTS "admin pode deletar pedidos" ON orders;
CREATE POLICY "admin pode deletar pedidos"
  ON orders FOR DELETE
  TO authenticated
  USING (true);

-- Order items: permitir que clientes anônimos criem itens
DROP POLICY IF EXISTS "clientes podem criar itens do pedido" ON order_items;
CREATE POLICY "clientes podem criar itens do pedido"
  ON order_items FOR INSERT
  TO anon
  WITH CHECK (true);

-- Order items: admin logado também pode criar itens
DROP POLICY IF EXISTS "authenticated pode criar itens do pedido" ON order_items;
CREATE POLICY "authenticated pode criar itens do pedido"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Order items: admin pode ver
DROP POLICY IF EXISTS "admin ve itens do pedido" ON order_items;
CREATE POLICY "admin ve itens do pedido"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

-- Order items: admin pode deletar
DROP POLICY IF EXISTS "admin pode deletar itens do pedido" ON order_items;
CREATE POLICY "admin pode deletar itens do pedido"
  ON order_items FOR DELETE
  TO authenticated
  USING (true);
-- ============================================================
-- MIGRAÇÃO COMPLETA — Padaria da Rose
-- Copie e cole TUDO no: Supabase > SQL Editor > Run
-- ============================================================

-- 1) Colunas de observação nos produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_obs boolean not null default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS obs_label text default 'Observação';

-- 2) Coluna de observação nos itens do pedido
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS observation text default '';

-- 3) Tabela de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint generated always as identity primary key,
  order_id bigint REFERENCES orders(id) ON DELETE SET NULL,
  employee_slug text NOT NULL,
  sender text NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "clientes podem enviar mensagem" ON chat_messages;
  DROP POLICY IF EXISTS "authenticated pode enviar mensagem" ON chat_messages;
  DROP POLICY IF EXISTS "anon pode ler mensagens" ON chat_messages;
  DROP POLICY IF EXISTS "authenticated pode ler mensagens" ON chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "clientes podem enviar mensagem" ON chat_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "authenticated pode enviar mensagem" ON chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon pode ler mensagens" ON chat_messages FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated pode ler mensagens" ON chat_messages FOR SELECT TO authenticated USING (true);

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4) Atualizar create_order com suporte a observation
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name text,
  p_customer_phone text,
  p_pickup_time text,
  p_notes text,
  p_employee_slug text,
  p_total numeric,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  new_order_id bigint;
  item jsonb;
  result jsonb;
BEGIN
  INSERT INTO orders (customer_name, customer_phone, pickup_time, notes, employee_slug, total, status)
  VALUES (p_customer_name, p_customer_phone, p_pickup_time, p_notes, p_employee_slug, p_total, 'novo')
  RETURNING id INTO new_order_id;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_name, qty, unit_price, observation)
    VALUES (
      new_order_id,
      item->>'product_name',
      (item->>'qty')::int,
      (item->>'unit_price')::numeric,
      COALESCE(item->>'observation', '')
    );
  END LOOP;

  SELECT jsonb_build_object(
    'id', new_order_id,
    'customer_name', p_customer_name,
    'customer_phone', p_customer_phone,
    'total', p_total
  ) INTO result;

  RETURN result;
END;
$$;

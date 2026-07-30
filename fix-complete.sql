-- ============================================================
-- FIX COMPLETO — Padaria da Rose
-- Copie e cole TUDO no: Supabase > SQL Editor > Run
-- ============================================================

-- 1) Garantir que create_order existe com suporte a observation
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

-- 2) Criar função reset_order_sequence (usada no admin)
CREATE OR REPLACE FUNCTION reset_order_sequence()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  ALTER SEQUENCE orders_id_seq RESTART WITH 1;
END;
$$;

-- 3) Garantir que a tabela chat_messages existe
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint generated always as identity primary key,
  order_id bigint REFERENCES orders(id) ON DELETE SET NULL,
  employee_slug text NOT NULL,
  sender text NOT NULL,
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Garantir RLS para chat_messages
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

-- DELETE: admin pode apagar qualquer mensagem
DO $$ BEGIN
  DROP POLICY IF EXISTS "authenticated pode apagar mensagens" ON chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
CREATE POLICY "authenticated pode apagar mensagens" ON chat_messages FOR DELETE TO authenticated USING (true);

-- DELETE: cliente pode apagar suas próprias mensagens
DO $$ BEGIN
  DROP POLICY IF EXISTS "anon pode apagar suas mensagens" ON chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
CREATE POLICY "anon pode apagar suas mensagens" ON chat_messages FOR DELETE TO anon USING (sender = 'customer');

-- 5) Garantir Realtime para chat_messages
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 6) Garantir que products tem as colunas necessárias
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_obs boolean not null default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS obs_label text default 'Observação';

-- 7) Garantir que order_items tem observation
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS observation text default '';

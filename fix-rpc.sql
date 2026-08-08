-- ============================================================
-- FIX: Criar funções RPC que faltam no banco
-- Cole isto em: Supabase > SQL Editor > New query > Run
-- ============================================================

-- 0. Dropar funções antigas com assinatura incorreta
DROP FUNCTION IF EXISTS create_order(text,text,text,text,text,numeric,jsonb);
DROP FUNCTION IF EXISTS get_customer_orders(text);
DROP FUNCTION IF EXISTS reset_order_sequence();

-- 1. create_order: cliente cria pedido via RPC (bypassa RLS)
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name text,
  p_customer_phone text,
  p_pickup_time text,
  p_notes text,
  p_employee_slug text,
  p_total numeric,
  p_items jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id bigint;
  v_item jsonb;
BEGIN
  INSERT INTO orders (customer_name, customer_phone, pickup_time, notes, employee_slug, total)
  VALUES (p_customer_name, p_customer_phone, p_pickup_time, p_notes, p_employee_slug, p_total)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_name, qty, unit_price, observation)
    VALUES (
      v_order_id,
      v_item->>'product_name',
      (v_item->>'qty')::int,
      (v_item->>'unit_price')::numeric,
      v_item->>'observation'
    );
  END LOOP;

  RETURN json_build_object('id', v_order_id);
END;
$$;

-- 2. get_customer_orders: cliente busca seus pedidos (bypassa RLS)
CREATE OR REPLACE FUNCTION get_customer_orders(p_phone text)
RETURNS SETOF orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM orders WHERE customer_phone = p_phone ORDER BY created_at DESC;
$$;

-- 3. reset_order_sequence: admin reseta numeração (precisa security definer)
CREATE OR REPLACE FUNCTION reset_order_sequence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE orders RESTART IDENTITY CASCADE;
END;
$$;

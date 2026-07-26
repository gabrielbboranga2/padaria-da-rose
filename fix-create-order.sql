-- ============================================================
-- ATUALIZAR create_order para incluir observation nos itens
-- Rode este arquivo em: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Recriar a função create_order com suporte a observation
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
  -- Inserir o pedido
  INSERT INTO orders (customer_name, customer_phone, pickup_time, notes, employee_slug, total, status)
  VALUES (p_customer_name, p_customer_phone, p_pickup_time, p_notes, p_employee_slug, p_total, 'novo')
  RETURNING id INTO new_order_id;

  -- Inserir os itens do pedido
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

  -- Retornar o pedido criado com seus itens
  SELECT jsonb_build_object(
    'id', new_order_id,
    'customer_name', p_customer_name,
    'customer_phone', p_customer_phone,
    'total', p_total
  ) INTO result;

  RETURN result;
END;
$$;

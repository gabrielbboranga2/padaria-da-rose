-- ============================================================
-- MIGRAÇÃO: Observação por produto, Chat, Login cliente
-- Rode este arquivo em: Supabase > SQL Editor > New query > Run
-- ============================================================

-- Adicionar colunas de observação na tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_obs boolean not null default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS obs_label text default 'Observação';

-- Adicionar coluna de observação na tabela order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS observation text default '';

-- Criar tabela de chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint generated always as identity primary key,
  order_id bigint REFERENCES orders(id) ON DELETE SET NULL,
  employee_slug text NOT NULL,
  sender text NOT NULL, -- 'customer' | 'seller'
  sender_name text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para chat
DO $$ BEGIN
  DROP POLICY IF EXISTS "clientes podem enviar mensagem" ON chat_messages;
  DROP POLICY IF EXISTS "authenticated pode enviar mensagem" ON chat_messages;
  DROP POLICY IF EXISTS "anon pode ler mensagens" ON chat_messages;
  DROP POLICY IF EXISTS "authenticated pode ler mensagens" ON chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "clientes podem enviar mensagem"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "authenticated pode enviar mensagem"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "anon pode ler mensagens"
  ON chat_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "authenticated pode ler mensagens"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

-- Habilitar realtime para chat_messages
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

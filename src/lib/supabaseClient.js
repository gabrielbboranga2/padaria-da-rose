import { createClient } from "@supabase/supabase-js";

// Essas duas chaves vêm do seu projeto Supabase:
// Project Settings > API > Project URL / anon public key
// Nunca coloque a chave "service_role" aqui — só a "anon public".
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const RAW_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "";
const SUPABASE_URL = RAW_URL.replace(/\/+$/, "");
const SUPABASE_KEY = RAW_KEY;

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabaseConfig(): { url: string; key: string } | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

/**
 * Cliente único do Supabase no navegador.
 *
 * O fluxo implícito é usado porque o app é exportado como site estático
 * (`output: "export"`): o link de confirmação do Supabase devolve os tokens no
 * fragmento da URL e o próprio SDK cria a sessão. Nenhum cookie de servidor é
 * necessário. A chave usada aqui é sempre a pública (`publishable`/`anon`).
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!browserClient) {
    browserClient = createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "implicit",
      },
    });
  }

  return browserClient;
}

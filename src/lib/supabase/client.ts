import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/** Cliente de Supabase para componentes que corren en el navegador ("use client"). */
export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}

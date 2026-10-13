import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Cliente de Supabase para el servidor (Server Components, Server Actions y
 * Route Handlers). Lee y escribe la sesión en las cookies del pedido.
 * Hay que crear uno nuevo en cada pedido; no reutilizarlo.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Los Server Components no pueden escribir cookies. No pasa nada:
          // src/proxy.ts ya renueva la sesión en cada pedido.
        }
      },
    },
  });
}

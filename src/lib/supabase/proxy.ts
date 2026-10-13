import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

/** Rutas que se pueden ver sin haber iniciado sesión. */
const RUTAS_PUBLICAS = ["/login"];

/**
 * Se ejecuta antes de cada página (desde src/proxy.ts):
 * 1. Renueva la sesión de Supabase si está por vencer.
 * 2. Manda a /login a quien no inició sesión.
 * 3. Manda a /agenda a quien ya inició sesión y entra a /login.
 *
 * Es una primera barrera de comodidad: la seguridad real de los datos
 * está en la base de datos (RLS), que se configura en la Fase 2.
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Evita que un CDN guarde en caché una respuesta con la sesión de alguien.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // No poner código entre createServerClient y getClaims: getClaims valida
  // el token y es lo que dispara la renovación de la sesión.
  const { data } = await supabase.auth.getClaims();
  const usuario = data?.claims;

  const { pathname } = request.nextUrl;
  const esPublica = RUTAS_PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );

  if (!usuario && !esPublica) {
    return redirigir(request, response, "/login");
  }
  if (usuario && esPublica) {
    return redirigir(request, response, "/agenda");
  }

  return response;
}

/** Redirige conservando las cookies de sesión que Supabase haya renovado. */
function redirigir(request: NextRequest, response: NextResponse, destino: string) {
  const redireccion = NextResponse.redirect(new URL(destino, request.url));
  response.cookies.getAll().forEach((cookie) => redireccion.cookies.set(cookie));
  return redireccion;
}

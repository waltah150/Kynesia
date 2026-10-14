import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type PerfilActual = {
  id: string;
  nombre: string;
  rol: "admin" | "profesional";
  profesionalId: string | null;
};

/**
 * Perfil de la persona logueada (o null si no hay sesión o el perfil está inactivo).
 * `cache` evita repetir la consulta si varios componentes lo piden en el mismo pedido.
 *
 * Sirve para mostrar u ocultar botones. Los permisos reales los aplica la base (RLS).
 */
export const obtenerPerfilActual = cache(async (): Promise<PerfilActual | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, profesional_id, activo")
    .eq("id", userId)
    .maybeSingle();

  if (!perfil?.activo) return null;
  return {
    id: perfil.id,
    nombre: perfil.nombre,
    rol: perfil.rol,
    profesionalId: perfil.profesional_id,
  };
});

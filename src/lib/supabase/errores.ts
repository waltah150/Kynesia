import type { PostgrestError } from "@supabase/supabase-js";

/** Mensajes para restricciones de la base que pueden fallar al guardar. */
const MENSAJES_POR_RESTRICCION: Record<string, string> = {
  grupos_nombre_unico: "Ya existe un grupo con ese nombre (puede estar desactivado).",
  servicios_nombre_unico_por_grupo:
    "Ya existe un subgrupo con ese nombre en este grupo (puede estar desactivado).",
  clientes_telefono_key: "Ya hay un cliente con ese teléfono (puede estar desactivado).",
  clientes_telefono_formato: "El teléfono no es válido.",
  horario_spa_sin_superposicion: "Hay rangos del horario que se pisan.",
  horarios_profesional_sin_superposicion: "Hay rangos del horario que se pisan.",
  horario_spa_pasos_15_min: "Las horas deben ir en pasos de 15 minutos.",
  horarios_profesional_pasos_15_min: "Las horas deben ir en pasos de 15 minutos.",
};

/**
 * Traduce un error de Supabase/Postgres a un mensaje claro en español.
 * Los códigos son los estándar de Postgres (ej. 23505 = valor repetido).
 */
export function traducirErrorDb(error: PostgrestError): string {
  const restriccion = Object.keys(MENSAJES_POR_RESTRICCION).find((nombre) =>
    `${error.message} ${error.details ?? ""}`.includes(nombre),
  );
  if (restriccion) return MENSAJES_POR_RESTRICCION[restriccion];

  switch (error.code) {
    case "42501":
      return "No tenés permiso para hacer este cambio.";
    case "23505":
      return "Ya existe un registro con esos datos.";
    case "23503":
      return "No se puede completar: hay datos relacionados que lo impiden.";
    case "23514":
    case "22P02":
      return "Algún dato no es válido. Revisá el formulario.";
    default:
      return "No se pudo guardar. Intentá de nuevo en unos minutos.";
  }
}

/** Mensaje cuando una modificación no afectó ninguna fila (RLS la filtró o ya no existe). */
export const SIN_PERMISO_O_INEXISTENTE =
  "No se pudo guardar: no tenés permiso o el registro ya no existe.";

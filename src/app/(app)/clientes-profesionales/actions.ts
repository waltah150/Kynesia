"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SIN_PERMISO_O_INEXISTENTE, traducirErrorDb } from "@/lib/supabase/errores";
import type { RangoHorario } from "@/lib/horarios";
import { leerFormulario, type ResultadoAccion } from "@/lib/validaciones/comunes";
import { clienteSchema, horarioSchema, profesionalSchema } from "@/lib/validaciones/personas";

/*
 * Acciones de la pantalla "Clientes y profesionales".
 * Validan de nuevo con Zod y dejan que la base aplique los permisos (RLS y
 * las funciones guardar_*, que revisan si quien llama es admin).
 */

const RUTA = "/clientes-profesionales";

/**
 * Los tipos generados por Supabase marcan los parámetros de las funciones como
 * obligatorios, pero Postgres acepta null (acá: "profesional nueva" o "sin cuenta").
 */
const nulo = null as unknown as string;

function erroresDeCampos(error: z.ZodError): ResultadoAccion {
  return { ok: false, fieldErrors: z.flattenError(error).fieldErrors };
}

// -----------------------------------------------------------------------------
// Clientes
// -----------------------------------------------------------------------------

/** Crea o edita un cliente. Devuelve su id (la agenda lo usará para seleccionarlo). */
export async function guardarCliente(formData: FormData): Promise<ResultadoAccion> {
  const parsed = clienteSchema.safeParse(leerFormulario(formData));
  if (!parsed.success) return erroresDeCampos(parsed.error);
  const { id, ...datos } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await (id
    ? supabase.from("clientes").update(datos).eq("id", id)
    : supabase.from("clientes").insert(datos)
  ).select("id");

  if (error) return { ok: false, error: traducirErrorDb(error) };
  if (!data?.length) return { ok: false, error: SIN_PERMISO_O_INEXISTENTE };
  revalidatePath(RUTA);
  return { ok: true, id: data[0].id };
}

/** Desactiva o reactiva un cliente (solo admin: lo controla la base). */
export async function cambiarEstadoCliente(id: string, activo: boolean): Promise<ResultadoAccion> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Datos inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .update({ activo })
    .eq("id", id)
    .select("id");

  if (error) {
    return {
      ok: false,
      error:
        error.code === "42501"
          ? "Solo un administrador puede desactivar o reactivar clientes."
          : traducirErrorDb(error),
    };
  }
  if (!data?.length) return { ok: false, error: SIN_PERMISO_O_INEXISTENTE };
  revalidatePath(RUTA);
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Profesionales
// -----------------------------------------------------------------------------

/** Guarda la ficha de una profesional (datos, servicios y cuenta) de una sola vez. */
export async function guardarProfesional(formData: FormData): Promise<ResultadoAccion> {
  const parsed = profesionalSchema.safeParse(leerFormulario(formData, ["grupos"]));
  if (!parsed.success) return erroresDeCampos(parsed.error);
  const p = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guardar_profesional", {
    p_id: p.id ?? nulo,
    p_nombre: p.nombre,
    p_apellido: p.apellido,
    p_color: p.color,
    p_activa: p.activa,
    p_grupos: p.grupos,
    p_perfil_id: p.perfil_id ?? nulo,
  });

  if (error) return { ok: false, error: traducirErrorDb(error) };
  revalidatePath(RUTA);
  return { ok: true, id: data };
}

export type ResultadoHorario = ResultadoAccion & { turnosFueraDeHorario?: number };

/** Reemplaza el horario semanal de una profesional y avisa cuántos turnos quedan fuera. */
export async function guardarHorarioProfesional(
  profesionalId: string,
  rangos: RangoHorario[],
): Promise<ResultadoHorario> {
  const parsed = horarioSchema.safeParse(rangos);
  if (!z.uuid().safeParse(profesionalId).success || !parsed.success) {
    return { ok: false, error: "El horario no es válido. Revisá los rangos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guardar_horario_profesional", {
    p_profesional_id: profesionalId,
    p_rangos: parsed.data,
  });

  if (error) return { ok: false, error: traducirErrorDb(error) };
  revalidatePath(RUTA);
  return { ok: true, turnosFueraDeHorario: data ?? 0 };
}

/** Reemplaza el horario de apertura del spa (solo admin). */
export async function guardarHorarioSpa(rangos: RangoHorario[]): Promise<ResultadoAccion> {
  const parsed = horarioSchema.safeParse(rangos);
  if (!parsed.success) return { ok: false, error: "El horario no es válido. Revisá los rangos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("guardar_horario_spa", {
    p_rangos: parsed.data.map(({ dia_semana, inicio, fin }) => ({
      dia_semana,
      apertura: inicio,
      cierre: fin,
    })),
  });

  if (error) return { ok: false, error: traducirErrorDb(error) };
  revalidatePath(RUTA);
  return { ok: true };
}

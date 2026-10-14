"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SIN_PERMISO_O_INEXISTENTE, traducirErrorDb } from "@/lib/supabase/errores";
import type { ResultadoAccion } from "@/lib/validaciones/comunes";
import {
  grupoSchema,
  paqueteSchema,
  promocionSchema,
  servicioSchema,
} from "@/lib/validaciones/servicios";

/*
 * Acciones de la pantalla "Servicios y precios".
 * Cada una valida otra vez con Zod (nunca se confía solo en el navegador) y
 * deja que la base aplique los permisos: si quien llama no es admin, RLS
 * rechaza el cambio y se devuelve un mensaje claro.
 */

type RespuestaDb = { data: { id: string }[] | null; error: PostgrestError | null };

/** Convierte la respuesta de Supabase en un ResultadoAccion y refresca la pantalla. */
function resultado({ data, error }: RespuestaDb): ResultadoAccion {
  if (error) return { ok: false, error: traducirErrorDb(error) };
  if (!data?.length) return { ok: false, error: SIN_PERMISO_O_INEXISTENTE };
  revalidatePath("/servicios");
  return { ok: true };
}

function erroresDeCampos(error: z.ZodError): ResultadoAccion {
  return { ok: false, fieldErrors: z.flattenError(error).fieldErrors };
}

export async function guardarGrupo(formData: FormData): Promise<ResultadoAccion> {
  const parsed = grupoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return erroresDeCampos(parsed.error);
  const { id, ...datos } = parsed.data;

  const supabase = await createClient();
  const consulta = id
    ? supabase.from("grupos").update(datos).eq("id", id)
    : supabase.from("grupos").insert(datos);
  return resultado(await consulta.select("id"));
}

export async function guardarServicio(formData: FormData): Promise<ResultadoAccion> {
  const parsed = servicioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return erroresDeCampos(parsed.error);
  const { id, ...datos } = parsed.data;

  const supabase = await createClient();
  const consulta = id
    ? supabase.from("servicios").update(datos).eq("id", id)
    : supabase.from("servicios").insert(datos);
  return resultado(await consulta.select("id"));
}

export async function guardarPaquete(formData: FormData): Promise<ResultadoAccion> {
  const parsed = paqueteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return erroresDeCampos(parsed.error);
  const { id, ...datos } = parsed.data;

  const supabase = await createClient();
  const consulta = id
    ? supabase.from("paquetes").update(datos).eq("id", id)
    : supabase.from("paquetes").insert(datos);
  return resultado(await consulta.select("id"));
}

export async function guardarPromocion(formData: FormData): Promise<ResultadoAccion> {
  const parsed = promocionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return erroresDeCampos(parsed.error);
  const { id, servicio_id, paquete_id, ...datos } = parsed.data;

  const supabase = await createClient();
  const consulta = id
    ? // Al editar no se cambia a qué subgrupo o paquete pertenece.
      supabase.from("promociones").update(datos).eq("id", id)
    : supabase.from("promociones").insert({
        ...datos,
        servicio_id: servicio_id ?? null,
        paquete_id: paquete_id ?? null,
      });
  return resultado(await consulta.select("id"));
}

const cambioDeEstadoSchema = z.object({
  tabla: z.enum(["grupos", "servicios", "paquetes", "promociones"]),
  id: z.uuid(),
  activo: z.boolean(),
});

export type TablaConEstado = z.infer<typeof cambioDeEstadoSchema>["tabla"];

/** Desactiva o reactiva un grupo, subgrupo, paquete o promoción (nunca se borran). */
export async function cambiarEstado(
  tabla: TablaConEstado,
  id: string,
  activo: boolean,
): Promise<ResultadoAccion> {
  const parsed = cambioDeEstadoSchema.safeParse({ tabla, id, activo });
  if (!parsed.success) return { ok: false, error: "Datos inválidos." };

  const supabase = await createClient();
  return resultado(
    await supabase
      .from(parsed.data.tabla)
      .update({ activo: parsed.data.activo })
      .eq("id", parsed.data.id)
      .select("id"),
  );
}

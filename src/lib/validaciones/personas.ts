import { z } from "zod";
import { aMinutos, DIAS_SEMANA, type RangoHorario } from "@/lib/horarios";
import { normalizarTelefono, OTRO_PAIS, PAIS_POR_DEFECTO } from "@/lib/telefono";
import { idOpcional, interruptor, textoObligatorio } from "./comunes";

/**
 * Cliente: nombre y apellido obligatorios. Teléfono y notas opcionales.
 * El teléfono se arma con el país elegido y se guarda como +595…, +54…, etc.
 */
export const clienteSchema = z
  .object({
    id: idOpcional,
    nombre: textoObligatorio("Ingresá el nombre.", 60),
    apellido: textoObligatorio("Ingresá el apellido.", 60),
    pais: z.string().default(PAIS_POR_DEFECTO),
    telefono: z.string().trim().optional(),
    notas: z
      .string()
      .trim()
      .max(500, "Máximo 500 caracteres.")
      .optional()
      .transform((texto) => texto || null),
  })
  .transform(({ pais, telefono, ...cliente }, ctx) => {
    if (!telefono) return { ...cliente, telefono: null as string | null };

    const normalizado = normalizarTelefono(telefono, pais);
    if (!normalizado) {
      ctx.addIssue({
        code: "custom",
        path: ["telefono"],
        message:
          pais === OTRO_PAIS
            ? "Escribí el número con el código del país. Ej.: +33 6 12 34 56 78"
            : "El teléfono no es válido para el país elegido.",
      });
      return z.NEVER;
    }
    return { ...cliente, telefono: normalizado };
  });

/** Ficha de profesional (sin el horario, que se guarda aparte). */
export const profesionalSchema = z.object({
  id: idOpcional,
  nombre: textoObligatorio("Ingresá el nombre.", 60),
  apellido: textoObligatorio("Ingresá el apellido.", 60),
  color: z.string("Elegí un color.").regex(/^#[0-9A-Fa-f]{6}$/, "Elegí un color."),
  activa: interruptor,
  grupos: z.array(z.uuid()).default([]),
  perfil_id: idOpcional,
});

const HORA = /^([01]\d|2[0-3]):(00|15|30|45)$/;

/**
 * Revisa una lista de rangos y devuelve un mensaje de error por día (o {} si está bien).
 * Se usa en el navegador (para avisar al instante) y en el servidor.
 */
export function erroresDeHorario(rangos: RangoHorario[]): Record<number, string> {
  const errores: Record<number, string> = {};
  for (const { numero, nombre } of DIAS_SEMANA) {
    const delDia = rangos
      .filter((r) => r.dia_semana === numero)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
    for (const [i, rango] of delDia.entries()) {
      if (!HORA.test(rango.inicio) || !HORA.test(rango.fin)) {
        errores[numero] = `${nombre}: elegí horas en pasos de 15 minutos.`;
      } else if (aMinutos(rango.inicio) >= aMinutos(rango.fin)) {
        errores[numero] = `${nombre}: la hora de fin debe ser posterior a la de inicio.`;
      } else if (i > 0 && aMinutos(rango.inicio) < aMinutos(delDia[i - 1].fin)) {
        errores[numero] = `${nombre}: hay rangos que se pisan.`;
      }
    }
  }
  return errores;
}

export const horarioSchema = z
  .array(
    z.object({
      dia_semana: z.number().int().min(1).max(7),
      inicio: z.string(),
      fin: z.string(),
    }),
  )
  .max(50)
  .refine((rangos) => Object.keys(erroresDeHorario(rangos)).length === 0, "El horario no es válido.");

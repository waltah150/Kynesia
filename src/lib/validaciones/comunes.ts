import { z } from "zod";

/** Resultado de una acción de servidor, listo para mostrar en un formulario. */
export type ResultadoAccion =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[] | undefined> };

/** Campo de texto obligatorio, sin espacios sobrantes. */
export function textoObligatorio(mensaje: string, maximo = 120) {
  return z
    .string(mensaje)
    .trim()
    .min(1, mensaje)
    .max(maximo, `Máximo ${maximo} caracteres.`);
}

/** id opcional: vacío al crear, uuid al editar. */
export const idOpcional = z.preprocess(
  (valor) => (valor === "" || valor === null ? undefined : valor),
  z.uuid().optional(),
);

/** Precio en guaraníes escrito como "150.000": se guardan solo los dígitos. */
export const precioGs = z
  .string("Ingresá el precio.")
  .transform((texto) => texto.replace(/\D/g, ""))
  .pipe(z.string().min(1, "Ingresá el precio."))
  .transform(Number)
  .pipe(z.number().int().max(1_000_000_000, "El precio es demasiado alto."));

/** Interruptor de formulario ("true" / "false"). */
export const interruptor = z.preprocess((valor) => valor === "true" || valor === "on", z.boolean());

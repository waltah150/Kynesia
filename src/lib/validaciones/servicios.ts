import { z } from "zod";
import { idOpcional, interruptor, precioGs, textoObligatorio } from "./comunes";

/** Grupo: solo un nombre (ej. "Depilación láser"). */
export const grupoSchema = z.object({
  id: idOpcional,
  nombre: textoObligatorio("Ingresá el nombre del grupo.", 80),
});

/** Subgrupo (servicio agendable): nombre, precio y duración en pasos de 15 min. */
export const servicioSchema = z.object({
  id: idOpcional,
  grupo_id: z.uuid("Elegí un grupo."),
  nombre: textoObligatorio("Ingresá el nombre del subgrupo.", 80),
  precio: precioGs,
  duracion_min: z.coerce
    .number("Elegí la duración.")
    .int()
    .refine((min) => min >= 15 && min <= 480 && min % 15 === 0, "Elegí la duración."),
  visible_web: interruptor,
  permite_dos_clientes: interruptor,
});

/** Paquete por sesiones de un subgrupo. */
export const paqueteSchema = z.object({
  id: idOpcional,
  servicio_id: z.uuid(),
  sesiones: z.coerce
    .number("Ingresá la cantidad de sesiones.")
    .int("La cantidad de sesiones debe ser un número entero.")
    .min(2, "Un paquete tiene al menos 2 sesiones.")
    .max(100, "Máximo 100 sesiones."),
  precio: precioGs,
});

/** Promoción temporal de un subgrupo o de un paquete (uno de los dos). */
export const promocionSchema = z
  .object({
    id: idOpcional,
    servicio_id: idOpcional,
    paquete_id: idOpcional,
    precio: precioGs,
    inicio: z.iso.date("Elegí la fecha de inicio."),
    fin: z.iso.date("Elegí la fecha de fin."),
  })
  .refine((promo) => promo.fin >= promo.inicio, {
    path: ["fin"],
    message: "La fecha de fin no puede ser anterior a la de inicio.",
  })
  .refine((promo) => Boolean(promo.servicio_id) !== Boolean(promo.paquete_id), {
    path: ["precio"],
    message: "La promoción debe ser de un subgrupo o de un paquete.",
  });

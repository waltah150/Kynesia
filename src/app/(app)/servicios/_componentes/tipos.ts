import type { Tables } from "@/lib/supabase/database.types";

/** Datos que la pantalla de servicios recibe del servidor, ya anidados. */
export type Promocion = Pick<
  Tables<"promociones">,
  "id" | "servicio_id" | "paquete_id" | "precio" | "inicio" | "fin" | "activo"
>;

export type Paquete = Pick<Tables<"paquetes">, "id" | "servicio_id" | "sesiones" | "precio" | "activo"> & {
  promociones: Promocion[];
};

export type Servicio = Pick<
  Tables<"servicios">,
  "id"
  | "grupo_id"
  | "nombre"
  | "duracion_min"
  | "precio"
  | "activo"
  | "visible_web"
  | "permite_dos_clientes"
  | "orden"
> & {
  paquetes: Paquete[];
  promociones: Promocion[];
};

export type Grupo = Pick<Tables<"grupos">, "id" | "nombre" | "orden" | "activo"> & {
  servicios: Servicio[];
};

export type EstadoPromocion = "vigente" | "proxima" | "vencida" | "inactiva";

/** Estado de una promoción según la fecha de hoy (AAAA-MM-DD, en Asunción). */
export function estadoPromocion(promo: Promocion, hoy: string): EstadoPromocion {
  if (!promo.activo) return "inactiva";
  if (promo.fin < hoy) return "vencida";
  if (promo.inicio > hoy) return "proxima";
  return "vigente";
}

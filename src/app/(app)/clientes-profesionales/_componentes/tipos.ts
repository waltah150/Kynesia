import type { RangoHorario } from "@/lib/horarios";

export type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  notas: string | null;
  activo: boolean;
};

export type Profesional = {
  id: string;
  nombre: string;
  apellido: string;
  color: string;
  activa: boolean;
  horarios: RangoHorario[];
  grupoIds: string[];
  /** Cuenta de acceso vinculada (solo admin ve las cuentas de las demás). */
  cuenta: { id: string; nombre: string } | null;
};

/** Grupos de servicios, para elegir cuáles realiza cada profesional. */
export type GrupoServicios = {
  id: string;
  nombre: string;
  /** Nombres de sus subgrupos activos, para mostrar de referencia. */
  servicios: string[];
};

/** Cuentas de Supabase Auth (perfiles) que se pueden vincular a una profesional. */
export type CuentaAcceso = {
  id: string;
  nombre: string;
  rol: "admin" | "profesional";
  profesionalId: string | null;
};

export type Pestana = "clientes" | "profesionales" | "horario";

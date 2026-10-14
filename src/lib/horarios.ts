/**
 * Horarios semanales (del spa y de cada profesional).
 * dia_semana: 1 = lunes … 7 = domingo. Horas como "HH:MM", en pasos de 15 min.
 */

export type RangoHorario = { dia_semana: number; inicio: string; fin: string };

export const DIAS_SEMANA = [
  { numero: 1, nombre: "Lunes" },
  { numero: 2, nombre: "Martes" },
  { numero: 3, nombre: "Miércoles" },
  { numero: 4, nombre: "Jueves" },
  { numero: 5, nombre: "Viernes" },
  { numero: 6, nombre: "Sábado" },
  { numero: 7, nombre: "Domingo" },
] as const;

/** Horas que se pueden elegir: de 06:00 a 23:00, cada 15 minutos. */
export const HORAS_ELEGIBLES = Array.from({ length: (23 - 6) * 4 + 1 }, (_, i) => {
  const minutos = 6 * 60 + i * 15;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
});

/** "09:00:00" (como lo devuelve la base) → "09:00" */
export function horaCorta(hora: string): string {
  return hora.slice(0, 5);
}

/** "09:00" → 540 */
export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** "Lunes 09:00–13:00 y 15:00–19:00" → texto corto para listas. */
export function resumirDia(rangos: RangoHorario[]): string {
  return rangos
    .slice()
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .map((r) => `${horaCorta(r.inicio)}–${horaCorta(r.fin)}`)
    .join(" y ");
}

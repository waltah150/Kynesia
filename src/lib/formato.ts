/**
 * Formatos de la app: guaraníes, duraciones y fechas en hora de Asunción.
 */

export const ZONA_HORARIA = "America/Asuncion";

const formatoMiles = new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 });

/** 150000 → "150.000" */
export function formatearMiles(valor: number): string {
  return formatoMiles.format(valor);
}

/** 150000 → "Gs. 150.000" */
export function formatearGs(valor: number): string {
  return `Gs. ${formatearMiles(valor)}`;
}

/** Deja solo los dígitos de lo que se escribió y lo muestra con puntos: "150000" → "150.000". */
export function formatearEntradaGs(texto: string): string {
  const digitos = texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digitos ? formatearMiles(Number(digitos)) : "";
}

/** 30 → "30 min", 60 → "1 h", 90 → "1 h 30 min" */
export function formatearDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Duraciones que se pueden elegir: de 15 min a 8 h, en pasos de 15. */
export const DURACIONES_MIN = Array.from({ length: 32 }, (_, i) => (i + 1) * 15);

/** Fecha de hoy en Asunción, como "AAAA-MM-DD" (mismo formato que las columnas date). */
export function hoyEnAsuncion(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(new Date());
}

/** "2026-11-30" → "30/11/2026" */
export function formatearFecha(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split("-");
  return `${Number(dia)}/${Number(mes)}/${anio}`;
}

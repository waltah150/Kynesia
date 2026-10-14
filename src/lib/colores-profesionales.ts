/**
 * Colores para los turnos de cada profesional en la agenda (CLAUDE.md §1.1):
 * tonos suaves que armonizan con la marca. Todos son claros, así el texto
 * oscuro de la app (#2B2F1E) se lee con buen contraste (AA).
 */
export const COLORES_PROFESIONALES = [
  { nombre: "Salvia", valor: "#A3B18A" },
  { nombre: "Arena", valor: "#D9C7A7" },
  { nombre: "Terracota claro", valor: "#E0A890" },
  { nombre: "Azul grisáceo", valor: "#9DB4C0" },
  { nombre: "Lavanda", valor: "#C3B1E1" },
  { nombre: "Rosa viejo", valor: "#D8A7B1" },
  { nombre: "Oliva claro", valor: "#C5CC9B" },
  { nombre: "Durazno", valor: "#F2C6A0" },
  { nombre: "Celeste", valor: "#B8D8D8" },
  { nombre: "Piedra", valor: "#C9C5BA" },
  { nombre: "Mostaza suave", valor: "#E3C77E" },
  { nombre: "Menta", valor: "#B5D3C0" },
] as const;

export function nombreDeColor(valor: string): string {
  return (
    COLORES_PROFESIONALES.find((c) => c.valor.toLowerCase() === valor.toLowerCase())?.nombre ??
    valor
  );
}

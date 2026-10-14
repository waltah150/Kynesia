/**
 * Normaliza lo que se escribe en un buscador igual que la columna
 * clientes.busqueda de la base (minúsculas y sin tildes), y lo separa en palabras.
 *
 * "José  Gómez" → ["jose", "gomez"];  "0981 123" → ["981", "123"]
 */
export function palabrasDeBusqueda(texto: string): string[] {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .map((palabra) => palabra.replace(/[%_,()]/g, ""))
    // En teléfonos se guarda +595981…: el 0 inicial de "0981" no aparece.
    .map((palabra) => (/^\d+$/.test(palabra) ? palabra.replace(/^0+/, "") : palabra))
    .filter(Boolean)
    .slice(0, 5);
}

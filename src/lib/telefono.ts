/**
 * Teléfonos: se elige el país (Paraguay por defecto) y se escribe el número
 * como sea ("0981 123 456", "981123456"…). Se guarda en formato internacional
 * sin espacios: "+595981123456". Un número escrito con "+" adelante se respeta tal cual.
 */

export const PAISES = [
  { codigo: "595", nombre: "Paraguay" },
  { codigo: "54", nombre: "Argentina" },
  { codigo: "55", nombre: "Brasil" },
  { codigo: "598", nombre: "Uruguay" },
  { codigo: "56", nombre: "Chile" },
  { codigo: "591", nombre: "Bolivia" },
  { codigo: "51", nombre: "Perú" },
  { codigo: "57", nombre: "Colombia" },
  { codigo: "52", nombre: "México" },
  { codigo: "34", nombre: "España" },
  { codigo: "39", nombre: "Italia" },
  { codigo: "49", nombre: "Alemania" },
  { codigo: "1", nombre: "EE. UU. / Canadá" },
] as const;

/** Valor del selector para un país que no está en la lista: se escribe con "+código". */
export const OTRO_PAIS = "otro";
export const PAIS_POR_DEFECTO = "595";

const FORMATO_INTERNACIONAL = /^\+[1-9]\d{7,14}$/;

/** Devuelve el teléfono normalizado, o null si no parece un teléfono válido. */
export function normalizarTelefono(texto: string, pais: string = PAIS_POR_DEFECTO): string | null {
  const limpio = texto.trim();
  const digitos = limpio.replace(/\D/g, "");
  if (!digitos) return null;

  let normalizado: string;
  if (limpio.startsWith("+")) {
    normalizado = `+${digitos}`;
  } else if (pais === OTRO_PAIS) {
    return null; // sin "+código" no hay forma de saber de qué país es
  } else if (pais === "595") {
    normalizado = digitos.startsWith("595") ? `+${digitos}` : `+595${digitos.replace(/^0+/, "")}`;
  } else {
    const sinCeros = digitos.replace(/^0+/, "");
    // Si ya escribieron el código del país (ej. "54 11…" con Argentina elegida), no se repite.
    normalizado =
      sinCeros.startsWith(pais) && sinCeros.length >= pais.length + 8
        ? `+${sinCeros}`
        : `+${pais}${sinCeros}`;
  }

  if (!FORMATO_INTERNACIONAL.test(normalizado)) return null;
  // Paraguay: después del 595 van 8 o 9 dígitos (celulares: 9XX XXX XXX).
  if (normalizado.startsWith("+595") && !/^\+595\d{8,9}$/.test(normalizado)) return null;
  return normalizado;
}

/** "+5491123456789" → { pais: "54", numero: "91123456789" }. Para cargar el formulario al editar. */
export function separarTelefono(telefono: string | null): { pais: string; numero: string } {
  if (!telefono) return { pais: PAIS_POR_DEFECTO, numero: "" };
  const pais = [...PAISES]
    .sort((a, b) => b.codigo.length - a.codigo.length)
    .find((p) => telefono.startsWith(`+${p.codigo}`));
  if (!pais) return { pais: OTRO_PAIS, numero: telefono };
  if (pais.codigo === "595") return { pais: "595", numero: formatearTelefono(telefono) };
  return { pais: pais.codigo, numero: telefono.slice(pais.codigo.length + 1) };
}

/**
 * Para mostrar: "+595981123456" → "0981 123 456"; otros países → "+54 91123456789".
 */
export function formatearTelefono(telefono: string | null): string {
  if (!telefono) return "";
  const celularPy = telefono.match(/^\+595(9\d{2})(\d{3})(\d{3})$/);
  if (celularPy) return `0${celularPy[1]} ${celularPy[2]} ${celularPy[3]}`;
  if (telefono.startsWith("+595")) return `0${telefono.slice(4)}`;
  const { pais, numero } = separarTelefono(telefono);
  return pais === OTRO_PAIS ? telefono : `+${pais} ${numero}`;
}

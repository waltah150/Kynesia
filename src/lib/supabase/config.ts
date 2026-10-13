/**
 * Datos públicos de conexión a Supabase, leídos de las variables de entorno
 * (.env.local en tu PC, "Environment variables" en Netlify).
 *
 * Solo se usa la clave pública (publishable). La clave secreta / service_role
 * nunca debe estar en este proyecto.
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Copiá .env.example como .env.local y completá los valores.",
    );
  }

  return { url, publishableKey };
}

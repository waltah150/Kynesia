"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginFieldErrors } from "@/lib/validaciones/auth";

export type LoginState = {
  error?: string;
  fieldErrors?: LoginFieldErrors;
  email?: string;
};

/** Inicia sesión con email y contraseña. Valida de nuevo en el servidor. */
export async function iniciarSesion(
  _estadoAnterior: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const resultado = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!resultado.success) {
    return {
      fieldErrors: z.flattenError(resultado.error).fieldErrors,
      email: String(formData.get("email") ?? ""),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(resultado.data);

  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? "Email o contraseña incorrectos."
          : "No pudimos iniciar sesión. Intentá de nuevo en unos minutos.",
      email: resultado.data.email,
    };
  }

  redirect("/agenda");
}

/** Cierra la sesión y vuelve al login. */
export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

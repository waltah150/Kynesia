import { z } from "zod";

/** Reglas del formulario de inicio de sesión (se usan en el navegador y en el servidor). */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Ingresá tu email.")
    .pipe(z.email("El email no tiene un formato válido.")),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Errores por campo, listos para mostrar debajo de cada input. */
export type LoginFieldErrors = Partial<Record<keyof LoginInput, string[]>>;

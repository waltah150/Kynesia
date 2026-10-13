"use client";

import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion, type LoginState } from "@/lib/auth/actions";
import { loginSchema, type LoginFieldErrors } from "@/lib/validaciones/auth";

export function LoginForm() {
  const [estado, accion, enviando] = useActionState<LoginState, FormData>(
    iniciarSesion,
    {},
  );
  // Errores detectados en el navegador, antes de llamar al servidor.
  const [erroresLocales, setErroresLocales] = useState<LoginFieldErrors>();

  function validarAntesDeEnviar(evento: FormEvent<HTMLFormElement>) {
    const datos = new FormData(evento.currentTarget);
    const resultado = loginSchema.safeParse({
      email: datos.get("email"),
      password: datos.get("password"),
    });
    if (!resultado.success) {
      evento.preventDefault();
      setErroresLocales(z.flattenError(resultado.error).fieldErrors);
      return;
    }
    setErroresLocales(undefined);
  }

  const errores = erroresLocales ?? estado.fieldErrors;

  return (
    <form
      action={accion}
      onSubmit={validarAntesDeEnviar}
      noValidate
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={estado.email}
          aria-invalid={Boolean(errores?.email)}
          aria-describedby={errores?.email ? "email-error" : undefined}
          className="h-11 bg-blanco"
        />
        {errores?.email && (
          <p id="email-error" className="text-sm text-alerta">
            {errores.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errores?.password)}
          aria-describedby={errores?.password ? "password-error" : undefined}
          className="h-11 bg-blanco"
        />
        {errores?.password && (
          <p id="password-error" className="text-sm text-alerta">
            {errores.password[0]}
          </p>
        )}
      </div>

      {estado.error && !erroresLocales && (
        <p
          role="alert"
          className="rounded-md border border-alerta/30 bg-alerta/5 px-3 py-2 text-sm text-alerta"
        >
          {estado.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={enviando}
        className="mt-2 h-11 text-sm tracking-[0.15em] uppercase hover:bg-verde-oliva-claro"
      >
        {enviando ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}

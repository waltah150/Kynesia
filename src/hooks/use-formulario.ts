"use client";

import { useState, useTransition, type FormEvent } from "react";
import { z } from "zod";
import type { ResultadoAccion } from "@/lib/validaciones/comunes";

export type ErroresFormulario = {
  general?: string;
  campos?: Record<string, string[] | undefined>;
};

/**
 * Maneja el envío de un formulario:
 * 1. Valida en el navegador con el mismo esquema Zod que usa el servidor.
 * 2. Si está bien, llama a la acción del servidor (que valida de nuevo).
 * 3. Muestra los errores o avisa el éxito.
 *
 * No usa <form action>, así los campos no se vacían si el servidor devuelve un error.
 */
export function useFormulario(
  schema: z.ZodType,
  accion: (formData: FormData) => Promise<ResultadoAccion>,
  alGuardar: () => void,
) {
  const [guardando, iniciarTransicion] = useTransition();
  const [errores, setErrores] = useState<ErroresFormulario>({});

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formData = new FormData(evento.currentTarget);

    const validacion = schema.safeParse(Object.fromEntries(formData));
    if (!validacion.success) {
      setErrores({ campos: z.flattenError(validacion.error).fieldErrors });
      return;
    }

    iniciarTransicion(async () => {
      const respuesta = await accion(formData);
      if (respuesta.ok) {
        setErrores({});
        alGuardar();
      } else {
        setErrores({ general: respuesta.error, campos: respuesta.fieldErrors });
      }
    });
  }

  return { onSubmit, guardando, errores };
}

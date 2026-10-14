import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

type CampoProps = {
  id: string;
  etiqueta: string;
  errores?: string[];
  ayuda?: string;
  children: ReactNode;
};

/** Etiqueta + control + mensaje de error (o de ayuda) debajo. */
export function Campo({ id, etiqueta, errores, ayuda, children }: CampoProps) {
  const error = errores?.[0];
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-alerta">
          {error}
        </p>
      ) : (
        ayuda && <p className="text-xs text-texto-suave">{ayuda}</p>
      )}
    </div>
  );
}

/** Error general del formulario (ej. "Ya existe un grupo con ese nombre"). */
export function ErrorFormulario({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-alerta/30 bg-alerta/5 px-3 py-2 text-sm text-alerta"
    >
      {mensaje}
    </p>
  );
}

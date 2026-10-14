"use client";

import { Button } from "@/components/ui/button";

/** Se muestra si una pantalla interna falla al cargar (ej. sin conexión con la base). */
export default function ErrorPantalla({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-lg border border-alerta/30 bg-blanco px-6 py-12 text-center">
      <p className="font-heading text-2xl text-verde-oliva">Algo salió mal</p>
      <p className="mt-2 text-sm text-texto-suave">
        No pudimos cargar esta pantalla. Revisá tu conexión e intentá de nuevo.
      </p>
      <Button onClick={reset} className="mt-6 h-10 hover:bg-verde-oliva-claro">
        Reintentar
      </Button>
    </div>
  );
}

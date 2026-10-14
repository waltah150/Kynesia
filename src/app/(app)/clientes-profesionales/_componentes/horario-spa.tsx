"use client";

import { toast } from "sonner";
import { EditorHorario } from "@/components/horarios/editor-horario";
import type { RangoHorario } from "@/lib/horarios";
import { guardarHorarioSpa } from "../actions";

/** Días y horas de apertura: definen qué muestra la agenda y cuándo se puede dar turno. */
export function HorarioSpa({ rangos, esAdmin }: { rangos: RangoHorario[]; esAdmin: boolean }) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-sm text-texto-suave">
        {esAdmin
          ? "Define las horas que muestra la agenda. No se pueden dar turnos fuera de este horario."
          : "Horario de apertura del spa. Solo la administración puede cambiarlo."}
      </p>
      {rangos.length === 0 && (
        <p className="rounded-md border border-alerta/30 bg-alerta/5 px-3 py-2 text-sm text-alerta">
          Todavía no hay horario cargado: la agenda no va a permitir dar turnos hasta que lo cargues.
        </p>
      )}
      <EditorHorario
        rangosIniciales={rangos}
        editable={esAdmin}
        etiquetaActivo="Abierto"
        etiquetaInactivo="Cerrado"
        guardar={async (nuevos) => {
          const resultado = await guardarHorarioSpa(nuevos);
          if (!resultado.ok) return resultado.error;
          toast.success("Horario del spa guardado.");
        }}
      />
    </div>
  );
}

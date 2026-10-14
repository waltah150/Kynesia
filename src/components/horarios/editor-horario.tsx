"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ErrorFormulario } from "@/components/formularios/campo";
import { cn } from "@/lib/utils";
import { DIAS_SEMANA, HORAS_ELEGIBLES, horaCorta, type RangoHorario } from "@/lib/horarios";
import { erroresDeHorario } from "@/lib/validaciones/personas";

type Rango = { inicio: string; fin: string };
type EstadoDias = Record<number, { activo: boolean; rangos: Rango[] }>;

const RANGO_NUEVO: Rango = { inicio: "09:00", fin: "18:00" };

type Props = {
  rangosIniciales: RangoHorario[];
  /** Si es false, solo se muestra (sin poder editar). */
  editable: boolean;
  /** Texto del interruptor de cada día: "Trabaja" (profesional) o "Abierto" (spa). */
  etiquetaActivo: string;
  etiquetaInactivo: string;
  /** Guarda el horario completo. Devuelve un error para mostrar, o nada si salió bien. */
  guardar: (rangos: RangoHorario[]) => Promise<string | undefined>;
};

/** Editor de horario semanal: por día, si trabaja/abre y uno o más rangos de 15 en 15 min. */
export function EditorHorario({
  rangosIniciales,
  editable,
  etiquetaActivo,
  etiquetaInactivo,
  guardar,
}: Props) {
  const [dias, setDias] = useState<EstadoDias>(() => estadoInicial(rangosIniciales));
  const [errorGuardado, setErrorGuardado] = useState<string>();
  const [guardando, iniciarTransicion] = useTransition();

  const rangos = aRangos(dias);
  const errores = erroresDeHorario(rangos);
  const hayErrores = Object.keys(errores).length > 0;

  function cambiarDia(numero: number, cambio: Partial<EstadoDias[number]>) {
    setDias((actual) => ({ ...actual, [numero]: { ...actual[numero], ...cambio } }));
  }

  function cambiarRango(numero: number, indice: number, cambio: Partial<Rango>) {
    const rangosDia = dias[numero].rangos.map((r, i) => (i === indice ? { ...r, ...cambio } : r));
    cambiarDia(numero, { rangos: rangosDia });
  }

  function agregarRango(numero: number) {
    const anteriores = dias[numero].rangos;
    const ultimo = anteriores.at(-1);
    // El rango nuevo arranca una hora después del último (ej. 13:00 → 14:00–18:00).
    const sugerido = ultimo
      ? { inicio: sumarHoras(ultimo.fin, 1), fin: sumarHoras(ultimo.fin, 4) }
      : RANGO_NUEVO;
    cambiarDia(numero, { rangos: [...anteriores, sugerido] });
  }

  function quitarRango(numero: number, indice: number) {
    cambiarDia(numero, { rangos: dias[numero].rangos.filter((_, i) => i !== indice) });
  }

  function alGuardar() {
    if (hayErrores) return;
    iniciarTransicion(async () => {
      setErrorGuardado(await guardar(rangos));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-blanco">
        {DIAS_SEMANA.map(({ numero, nombre }) => {
          const dia = dias[numero];
          return (
            <li key={numero} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex items-center justify-between gap-3 sm:w-44 sm:pt-1.5">
                <span className="text-sm text-texto">{nombre}</span>
                <label className="flex items-center gap-2 text-xs text-texto-suave">
                  {dia.activo ? etiquetaActivo : etiquetaInactivo}
                  <Switch
                    checked={dia.activo}
                    disabled={!editable}
                    onCheckedChange={(activo) =>
                      cambiarDia(numero, {
                        activo,
                        rangos: activo && dia.rangos.length === 0 ? [RANGO_NUEVO] : dia.rangos,
                      })
                    }
                    aria-label={`${nombre}: ${etiquetaActivo}`}
                  />
                </label>
              </div>

              {dia.activo && (
                <div className="flex flex-1 flex-col gap-2">
                  {dia.rangos.map((rango, indice) => (
                    <div key={indice} className="flex flex-wrap items-center gap-2">
                      <SelectorHora
                        valor={rango.inicio}
                        disabled={!editable}
                        etiqueta={`${nombre}, desde`}
                        onChange={(inicio) => cambiarRango(numero, indice, { inicio })}
                      />
                      <span className="text-texto-suave">a</span>
                      <SelectorHora
                        valor={rango.fin}
                        disabled={!editable}
                        etiqueta={`${nombre}, hasta`}
                        onChange={(fin) => cambiarRango(numero, indice, { fin })}
                      />
                      {editable && dia.rangos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => quitarRango(numero, indice)}
                          aria-label="Quitar este rango"
                          className="text-texto-suave hover:text-alerta"
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => agregarRango(numero)}
                      className="flex w-fit items-center gap-1 text-xs text-verde-oliva hover:underline"
                    >
                      <Plus className="size-3.5" /> Agregar otro rango
                    </button>
                  )}
                  {errores[numero] && <p className="text-sm text-alerta">{errores[numero]}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ErrorFormulario mensaje={errorGuardado} />

      {editable && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={alGuardar}
            disabled={guardando || hayErrores}
            className="h-10 hover:bg-verde-oliva-claro"
          >
            {guardando ? "Guardando…" : "Guardar horario"}
          </Button>
        </div>
      )}
    </div>
  );
}

function SelectorHora({
  valor,
  disabled,
  etiqueta,
  onChange,
}: {
  valor: string;
  disabled: boolean;
  etiqueta: string;
  onChange: (valor: string) => void;
}) {
  // Si la hora guardada no está en la lista (ej. 05:30), se agrega para no perderla.
  const opciones = HORAS_ELEGIBLES.includes(valor) ? HORAS_ELEGIBLES : [valor, ...HORAS_ELEGIBLES];
  return (
    <select
      value={valor}
      disabled={disabled}
      aria-label={etiqueta}
      onChange={(evento) => onChange(evento.target.value)}
      className={cn(
        "h-9 rounded-md border border-input bg-blanco px-2 text-sm text-texto outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-70",
      )}
    >
      {opciones.map((hora) => (
        <option key={hora} value={hora}>
          {hora}
        </option>
      ))}
    </select>
  );
}

function estadoInicial(rangos: RangoHorario[]): EstadoDias {
  const estado: EstadoDias = {};
  for (const { numero } of DIAS_SEMANA) {
    const delDia = rangos
      .filter((r) => r.dia_semana === numero)
      .map((r) => ({ inicio: horaCorta(r.inicio), fin: horaCorta(r.fin) }))
      .sort((a, b) => a.inicio.localeCompare(b.inicio));
    estado[numero] = { activo: delDia.length > 0, rangos: delDia };
  }
  return estado;
}

function aRangos(dias: EstadoDias): RangoHorario[] {
  return DIAS_SEMANA.flatMap(({ numero }) =>
    dias[numero].activo
      ? dias[numero].rangos.map((r) => ({ dia_semana: numero, inicio: r.inicio, fin: r.fin }))
      : [],
  );
}

/** "13:00" + 1 → "14:00" (sin pasar de 23:00). */
function sumarHoras(hora: string, horas: number): string {
  const [h, m] = hora.split(":").map(Number);
  const nueva = Math.min(h + horas, 23);
  return `${String(nueva).padStart(2, "0")}:${String(nueva === 23 ? 0 : m).padStart(2, "0")}`;
}

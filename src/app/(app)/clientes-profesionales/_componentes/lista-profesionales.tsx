"use client";

import { useState } from "react";
import { CalendarClock, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Campo, ErrorFormulario } from "@/components/formularios/campo";
import { EditorHorario } from "@/components/horarios/editor-horario";
import { useFormulario } from "@/hooks/use-formulario";
import { COLORES_PROFESIONALES } from "@/lib/colores-profesionales";
import { DIAS_SEMANA, resumirDia } from "@/lib/horarios";
import { cn } from "@/lib/utils";
import { profesionalSchema } from "@/lib/validaciones/personas";
import { guardarHorarioProfesional, guardarProfesional } from "../actions";
import type { CuentaAcceso, GrupoServicios, Profesional } from "./tipos";

type Props = {
  profesionales: Profesional[];
  grupos: GrupoServicios[];
  cuentas: CuentaAcceso[];
  esAdmin: boolean;
  /** Profesional vinculada a la persona logueada (puede editar su propio horario). */
  miProfesionalId: string | null;
};

type Dialogo = { tipo: "ficha"; profesional?: Profesional } | { tipo: "horario"; profesional: Profesional };

export function ListaProfesionales({ profesionales, grupos, cuentas, esAdmin, miProfesionalId }: Props) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const visibles = profesionales.filter((p) => mostrarInactivas || p.activa);
  const nombresGrupos = new Map(grupos.map((g) => [g.id, g.nombre]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {esAdmin ? (
          <Button onClick={() => setDialogo({ tipo: "ficha" })} className="h-10 hover:bg-verde-oliva-claro">
            <Plus /> Nueva profesional
          </Button>
        ) : (
          <p className="text-sm text-texto-suave">Podés editar tu propio horario.</p>
        )}
        <label className="flex items-center gap-2 text-sm text-texto-suave">
          <Switch checked={mostrarInactivas} onCheckedChange={setMostrarInactivas} />
          Mostrar inactivas
        </label>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-dorado/50 bg-blanco px-6 py-12 text-center">
          <p className="font-heading text-2xl text-verde-oliva">Todavía no hay profesionales</p>
          <p className="mt-2 text-sm text-texto-suave">
            {esAdmin
              ? "Cargá la primera con \"+ Nueva profesional\"."
              : "La administración todavía no cargó profesionales."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visibles.map((profesional) => {
            const puedeEditarHorario = esAdmin || profesional.id === miProfesionalId;
            const gruposQueRealiza = profesional.grupoIds
              .map((id) => nombresGrupos.get(id))
              .filter(Boolean);
            return (
              <li
                key={profesional.id}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border border-border bg-blanco p-4",
                  !profesional.activa && "opacity-60",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 size-5 shrink-0 rounded-full border border-black/10"
                    style={{ backgroundColor: profesional.color }}
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-heading text-xl font-medium tracking-wide text-verde-oliva">
                        {profesional.nombre} {profesional.apellido}
                      </span>
                      {!profesional.activa && (
                        <Badge variant="outline" className="border-border text-texto-suave">
                          Inactiva
                        </Badge>
                      )}
                    </span>
                    {esAdmin && (
                      <span className="truncate text-xs text-texto-suave">
                        {profesional.cuenta ? `Cuenta: ${profesional.cuenta.nombre}` : "Sin cuenta de acceso"}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-texto-suave">
                  {gruposQueRealiza.length > 0 ? gruposQueRealiza.join(" · ") : "Sin servicios asignados"}
                </p>

                <ResumenHorario profesional={profesional} />

                {(esAdmin || puedeEditarHorario) && (
                  <div className="flex flex-wrap gap-1 border-t border-border pt-2">
                    {esAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialogo({ tipo: "ficha", profesional })}
                        className="h-8 text-verde-oliva hover:bg-crema hover:text-verde-oliva"
                      >
                        <Pencil /> Editar ficha
                      </Button>
                    )}
                    {puedeEditarHorario && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialogo({ tipo: "horario", profesional })}
                        className="h-8 text-verde-oliva hover:bg-crema hover:text-verde-oliva"
                      >
                        <CalendarClock /> Horario
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialogo !== null} onOpenChange={(abierto) => !abierto && setDialogo(null)}>
        <DialogContent
          className={cn(
            "max-h-[90dvh] overflow-y-auto bg-crema",
            dialogo?.tipo === "horario" ? "sm:max-w-2xl" : "sm:max-w-lg",
          )}
        >
          {dialogo?.tipo === "ficha" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-verde-oliva">
                  {dialogo.profesional ? "Editar profesional" : "Nueva profesional"}
                </DialogTitle>
              </DialogHeader>
              <FormProfesional
                profesional={dialogo.profesional}
                grupos={grupos}
                cuentas={cuentas}
                profesionales={profesionales}
                alGuardar={() => {
                  setDialogo(null);
                  toast.success("Profesional guardada.");
                }}
              />
            </>
          )}
          {dialogo?.tipo === "horario" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-verde-oliva">Horario semanal</DialogTitle>
                <DialogDescription>
                  {dialogo.profesional.nombre} {dialogo.profesional.apellido}. Se repite todas las
                  semanas hasta que lo cambies.
                </DialogDescription>
              </DialogHeader>
              <EditorHorario
                rangosIniciales={dialogo.profesional.horarios}
                editable
                etiquetaActivo="Trabaja"
                etiquetaInactivo="No trabaja"
                guardar={async (rangos) => {
                  const resultado = await guardarHorarioProfesional(dialogo.profesional.id, rangos);
                  if (!resultado.ok) return resultado.error;
                  setDialogo(null);
                  const fuera = resultado.turnosFueraDeHorario ?? 0;
                  if (fuera > 0) {
                    toast.warning(
                      fuera === 1
                        ? "Horario guardado. 1 turno futuro quedó fuera del nuevo horario: aparecerá con \"!\" en la agenda."
                        : `Horario guardado. ${fuera} turnos futuros quedaron fuera del nuevo horario: aparecerán con "!" en la agenda.`,
                      { duration: 10000 },
                    );
                  } else {
                    toast.success("Horario guardado.");
                  }
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Horario compacto en la tarjeta: "Lun 09:00–13:00 y 15:00–19:00". */
function ResumenHorario({ profesional }: { profesional: Profesional }) {
  const dias = DIAS_SEMANA.map((dia) => ({
    ...dia,
    rangos: profesional.horarios.filter((r) => r.dia_semana === dia.numero),
  })).filter((dia) => dia.rangos.length > 0);

  if (dias.length === 0) {
    return <p className="text-xs text-alerta">Sin horario cargado: no aparecerá disponible en la agenda.</p>;
  }
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      {dias.map((dia) => (
        <div key={dia.numero} className="contents">
          <dt className="text-texto-suave">{dia.nombre.slice(0, 3)}</dt>
          <dd className="text-texto">{resumirDia(dia.rangos)}</dd>
        </div>
      ))}
    </dl>
  );
}

// -----------------------------------------------------------------------------
// Ficha de profesional
// -----------------------------------------------------------------------------
function FormProfesional({
  profesional,
  grupos,
  cuentas,
  profesionales,
  alGuardar,
}: {
  profesional?: Profesional;
  grupos: GrupoServicios[];
  cuentas: CuentaAcceso[];
  profesionales: Profesional[];
  alGuardar: () => void;
}) {
  const { onSubmit, guardando, errores } = useFormulario(
    profesionalSchema,
    guardarProfesional,
    alGuardar,
    ["grupos"],
  );
  // Color sugerido para una profesional nueva: el primero que nadie usa todavía.
  const colorInicial =
    profesional?.color ??
    COLORES_PROFESIONALES.find((c) => !profesionales.some((p) => p.color === c.valor))?.valor ??
    COLORES_PROFESIONALES[0].valor;
  const nombrePorProfesional = new Map(profesionales.map((p) => [p.id, `${p.nombre} ${p.apellido}`]));

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="flex flex-col gap-5">
      <input type="hidden" name="id" value={profesional?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="prof-nombre" etiqueta="Nombre" errores={errores.campos?.nombre}>
          <Input
            id="prof-nombre"
            name="nombre"
            defaultValue={profesional?.nombre}
            autoComplete="off"
            autoFocus
            aria-invalid={Boolean(errores.campos?.nombre)}
            className="h-10 bg-blanco"
          />
        </Campo>
        <Campo id="prof-apellido" etiqueta="Apellido" errores={errores.campos?.apellido}>
          <Input
            id="prof-apellido"
            name="apellido"
            defaultValue={profesional?.apellido}
            autoComplete="off"
            aria-invalid={Boolean(errores.campos?.apellido)}
            className="h-10 bg-blanco"
          />
        </Campo>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Color en la agenda</legend>
        <div className="flex flex-wrap gap-2">
          {COLORES_PROFESIONALES.map((color) => (
            <label key={color.valor} title={color.nombre} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={color.valor}
                defaultChecked={colorInicial === color.valor}
                className="peer sr-only"
              />
              <span
                className="block size-8 rounded-full border border-black/10 ring-offset-2 ring-offset-crema peer-checked:ring-2 peer-checked:ring-verde-oliva peer-focus-visible:ring-2 peer-focus-visible:ring-dorado"
                style={{ backgroundColor: color.valor }}
              />
              <span className="sr-only">{color.nombre}</span>
            </label>
          ))}
        </div>
        {errores.campos?.color && <p className="text-sm text-alerta">{errores.campos.color[0]}</p>}
      </fieldset>

      <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-blanco px-3 py-2.5">
        <span className="flex flex-col">
          <span className="text-sm">Activa</span>
          <span className="text-xs text-texto-suave">Las inactivas no aparecen en la agenda.</span>
        </span>
        <Switch name="activa" value="true" uncheckedValue="false" defaultChecked={profesional?.activa ?? true} />
      </label>

      <Campo
        id="prof-cuenta"
        etiqueta="Cuenta de acceso (opcional)"
        errores={errores.campos?.perfil_id}
        ayuda="Usuario creado en Supabase (Authentication → Users). Permite que entre a la app y edite su horario."
      >
        <select
          id="prof-cuenta"
          name="perfil_id"
          defaultValue={profesional?.cuenta?.id ?? ""}
          className="h-10 rounded-md border border-input bg-blanco px-2 text-sm text-texto outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Sin cuenta</option>
          {cuentas.map((cuenta) => {
            const vinculadaAOtra =
              cuenta.profesionalId && cuenta.profesionalId !== profesional?.id
                ? nombrePorProfesional.get(cuenta.profesionalId)
                : null;
            return (
              <option key={cuenta.id} value={cuenta.id}>
                {cuenta.nombre}
                {cuenta.rol === "admin" ? " (admin)" : ""}
                {vinculadaAOtra ? ` — hoy vinculada a ${vinculadaAOtra}` : ""}
              </option>
            );
          })}
        </select>
      </Campo>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Servicios que realiza</legend>
        <p className="-mt-1 text-xs text-texto-suave">
          Al elegir un grupo, puede atender todos sus subgrupos (también los que se agreguen después).
        </p>
        {grupos.length === 0 ? (
          <p className="text-sm text-texto-suave">Todavía no hay servicios cargados.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-md border border-border bg-blanco">
            {grupos.map((grupo) => (
              <label key={grupo.id} className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
                <input
                  type="checkbox"
                  name="grupos"
                  value={grupo.id}
                  defaultChecked={profesional?.grupoIds.includes(grupo.id)}
                  className="mt-0.5 size-4 shrink-0 accent-verde-oliva"
                />
                <span className="flex flex-col">
                  <span className="text-sm text-texto">{grupo.nombre}</span>
                  {grupo.servicios.length > 0 && (
                    <span className="text-xs text-texto-suave">{grupo.servicios.join(" · ")}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <ErrorFormulario mensaje={errores.general} />

      <DialogFooter className="bg-crema">
        <DialogClose render={<Button type="button" variant="outline" className="h-10" />}>
          Cancelar
        </DialogClose>
        <Button type="submit" disabled={guardando} className="h-10 hover:bg-verde-oliva-claro">
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

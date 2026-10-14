"use client";

import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Campo, ErrorFormulario } from "@/components/formularios/campo";
import { InputGuaranies } from "@/components/formularios/input-guaranies";
import { useFormulario } from "@/hooks/use-formulario";
import { DURACIONES_MIN, formatearDuracion, hoyEnAsuncion } from "@/lib/formato";
import {
  grupoSchema,
  paqueteSchema,
  promocionSchema,
  servicioSchema,
} from "@/lib/validaciones/servicios";
import { guardarGrupo, guardarPaquete, guardarPromocion, guardarServicio } from "../actions";
import type { Grupo, Paquete, Promocion, Servicio } from "./tipos";

const CLASE_INPUT = "h-10 bg-blanco";

// Con un máximo de 4 cifras en el año, el navegador no deja escribir años como 202611.
const FECHA_MIN = "2020-01-01";
const FECHA_MAX = "2099-12-31";

type BaseProps = { alGuardar: () => void };

/** Botones de pie de cada formulario. */
function BotonesFormulario({ guardando }: { guardando: boolean }) {
  return (
    <DialogFooter className="bg-crema">
      <DialogClose render={<Button type="button" variant="outline" className="h-10" />}>
        Cancelar
      </DialogClose>
      <Button type="submit" disabled={guardando} className="h-10 hover:bg-verde-oliva-claro">
        {guardando ? "Guardando…" : "Guardar"}
      </Button>
    </DialogFooter>
  );
}

// -----------------------------------------------------------------------------
// Grupo
// -----------------------------------------------------------------------------
export function FormGrupo({ grupo, alGuardar }: BaseProps & { grupo?: Grupo }) {
  const { onSubmit, guardando, errores } = useFormulario(grupoSchema, guardarGrupo, alGuardar);

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
      <input type="hidden" name="id" value={grupo?.id ?? ""} />
      <Campo id="grupo-nombre" etiqueta="Nombre del grupo" errores={errores.campos?.nombre}>
        <Input
          id="grupo-nombre"
          name="nombre"
          defaultValue={grupo?.nombre}
          placeholder="Ej. Depilación láser"
          autoComplete="off"
          autoFocus
          aria-invalid={Boolean(errores.campos?.nombre)}
          className={CLASE_INPUT}
        />
      </Campo>
      <ErrorFormulario mensaje={errores.general} />
      <BotonesFormulario guardando={guardando} />
    </form>
  );
}

// -----------------------------------------------------------------------------
// Subgrupo (servicio)
// -----------------------------------------------------------------------------
export function FormServicio({
  servicio,
  grupoIdInicial,
  grupos,
  alGuardar,
}: BaseProps & { servicio?: Servicio; grupoIdInicial?: string; grupos: Grupo[] }) {
  const { onSubmit, guardando, errores } = useFormulario(
    servicioSchema,
    guardarServicio,
    alGuardar,
  );
  const opcionesGrupo = grupos
    .filter((g) => g.activo || g.id === servicio?.grupo_id)
    .map((g) => ({ value: g.id, label: g.nombre }));
  const opcionesDuracion = DURACIONES_MIN.map((min) => ({
    value: String(min),
    label: formatearDuracion(min),
  }));

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
      <input type="hidden" name="id" value={servicio?.id ?? ""} />

      <Campo id="servicio-grupo" etiqueta="Grupo" errores={errores.campos?.grupo_id}>
        <Select
          name="grupo_id"
          items={opcionesGrupo}
          defaultValue={servicio?.grupo_id ?? grupoIdInicial ?? null}
        >
          <SelectTrigger
            id="servicio-grupo"
            aria-invalid={Boolean(errores.campos?.grupo_id)}
            className="h-10 w-full bg-blanco"
          >
            <SelectValue placeholder="Elegí un grupo" />
          </SelectTrigger>
          <SelectContent>
            {opcionesGrupo.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      <Campo id="servicio-nombre" etiqueta="Nombre del subgrupo" errores={errores.campos?.nombre}>
        <Input
          id="servicio-nombre"
          name="nombre"
          defaultValue={servicio?.nombre}
          placeholder="Ej. Rostro"
          autoComplete="off"
          aria-invalid={Boolean(errores.campos?.nombre)}
          className={CLASE_INPUT}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="servicio-precio" etiqueta="Precio" errores={errores.campos?.precio}>
          <InputGuaranies
            id="servicio-precio"
            name="precio"
            valorInicial={servicio?.precio}
            invalido={Boolean(errores.campos?.precio)}
          />
        </Campo>

        <Campo id="servicio-duracion" etiqueta="Duración" errores={errores.campos?.duracion_min}>
          <Select
            name="duracion_min"
            items={opcionesDuracion}
            defaultValue={servicio ? String(servicio.duracion_min) : null}
          >
            <SelectTrigger
              id="servicio-duracion"
              aria-invalid={Boolean(errores.campos?.duracion_min)}
              className="h-10 w-full bg-blanco"
            >
              <SelectValue placeholder="Elegí" />
            </SelectTrigger>
            <SelectContent>
              {opcionesDuracion.map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-blanco px-3 py-2.5">
        <span className="flex flex-col">
          <span className="text-sm">Permite atender 2 clientes a la vez</span>
          <span className="text-xs text-texto-suave">
            La profesional puede tener 2 turnos simultáneos de este servicio, en boxes distintos.
            Ej.: masaje reductor.
          </span>
        </span>
        <Switch
          name="permite_dos_clientes"
          value="true"
          uncheckedValue="false"
          defaultChecked={servicio?.permite_dos_clientes ?? false}
        />
      </label>

      <label className="flex items-center justify-between gap-4 rounded-md border border-border bg-blanco px-3 py-2.5">
        <span className="flex flex-col">
          <span className="text-sm">Mostrar en la web</span>
          <span className="text-xs text-texto-suave">Para la futura web pública del spa.</span>
        </span>
        <Switch
          name="visible_web"
          value="true"
          uncheckedValue="false"
          defaultChecked={servicio?.visible_web ?? false}
        />
      </label>

      <ErrorFormulario mensaje={errores.general} />
      <BotonesFormulario guardando={guardando} />
    </form>
  );
}

// -----------------------------------------------------------------------------
// Paquete
// -----------------------------------------------------------------------------
export function FormPaquete({
  servicioId,
  paquete,
  alGuardar,
}: BaseProps & { servicioId: string; paquete?: Paquete }) {
  const { onSubmit, guardando, errores } = useFormulario(paqueteSchema, guardarPaquete, alGuardar);

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
      <input type="hidden" name="id" value={paquete?.id ?? ""} />
      <input type="hidden" name="servicio_id" value={servicioId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="paquete-sesiones" etiqueta="Sesiones" errores={errores.campos?.sesiones}>
          <Input
            id="paquete-sesiones"
            name="sesiones"
            type="number"
            inputMode="numeric"
            min={2}
            max={100}
            defaultValue={paquete?.sesiones}
            placeholder="Ej. 6"
            autoFocus
            aria-invalid={Boolean(errores.campos?.sesiones)}
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo id="paquete-precio" etiqueta="Precio del paquete" errores={errores.campos?.precio}>
          <InputGuaranies
            id="paquete-precio"
            name="precio"
            valorInicial={paquete?.precio}
            invalido={Boolean(errores.campos?.precio)}
          />
        </Campo>
      </div>

      <ErrorFormulario mensaje={errores.general} />
      <BotonesFormulario guardando={guardando} />
    </form>
  );
}

// -----------------------------------------------------------------------------
// Promoción
// -----------------------------------------------------------------------------
export type DestinoPromocion = { servicioId: string } | { paqueteId: string };

export function FormPromocion({
  destino,
  promocion,
  alGuardar,
}: BaseProps & { destino: DestinoPromocion; promocion?: Promocion }) {
  const { onSubmit, guardando, errores } = useFormulario(
    promocionSchema,
    guardarPromocion,
    alGuardar,
  );
  const hoy = hoyEnAsuncion();

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
      <input type="hidden" name="id" value={promocion?.id ?? ""} />
      <input
        type="hidden"
        name="servicio_id"
        value={"servicioId" in destino ? destino.servicioId : ""}
      />
      <input type="hidden" name="paquete_id" value={"paqueteId" in destino ? destino.paqueteId : ""} />

      <Campo id="promo-precio" etiqueta="Precio promocional" errores={errores.campos?.precio}>
        <InputGuaranies
          id="promo-precio"
          name="precio"
          valorInicial={promocion?.precio}
          invalido={Boolean(errores.campos?.precio)}
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="promo-inicio" etiqueta="Desde" errores={errores.campos?.inicio}>
          <Input
            id="promo-inicio"
            name="inicio"
            type="date"
            min={FECHA_MIN}
            max={FECHA_MAX}
            defaultValue={promocion?.inicio ?? hoy}
            aria-invalid={Boolean(errores.campos?.inicio)}
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo
          id="promo-fin"
          etiqueta="Hasta (incluido)"
          errores={errores.campos?.fin}
        >
          <Input
            id="promo-fin"
            name="fin"
            type="date"
            min={FECHA_MIN}
            max={FECHA_MAX}
            defaultValue={promocion?.fin}
            aria-invalid={Boolean(errores.campos?.fin)}
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
      <p className="-mt-2 text-xs text-texto-suave">
        Pasada la fecha de fin, la promoción pasa sola a &quot;Vencidas&quot;.
      </p>

      <ErrorFormulario mensaje={errores.general} />
      <BotonesFormulario guardando={guardando} />
    </form>
  );
}

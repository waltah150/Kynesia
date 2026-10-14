"use client";

import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Campo, ErrorFormulario } from "@/components/formularios/campo";
import { useFormulario } from "@/hooks/use-formulario";
import { OTRO_PAIS, PAISES, separarTelefono } from "@/lib/telefono";
import { clienteSchema } from "@/lib/validaciones/personas";
import type { ResultadoAccion } from "@/lib/validaciones/comunes";

export type ClienteEditable = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  notas: string | null;
};

type Props = {
  cliente?: ClienteEditable;
  /** Acción de servidor que guarda (guardarCliente). */
  guardar: (formData: FormData) => Promise<ResultadoAccion>;
  /** Se llama al guardar, con el id del cliente (la agenda lo usa para seleccionarlo). */
  alGuardar: (id?: string) => void;
};

/**
 * Formulario de cliente. Se usa en "Clientes y profesionales" y, en la Fase 5,
 * desde la agenda ("+ Nuevo cliente" sin perder el turno que se está cargando).
 */
export function FormCliente({ cliente, guardar, alGuardar }: Props) {
  const { onSubmit, guardando, errores } = useFormulario(clienteSchema, guardar, (resultado) =>
    alGuardar(resultado.id),
  );

  const clase = "h-10 bg-blanco";
  const telefonoInicial = separarTelefono(cliente?.telefono ?? null);

  return (
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="flex flex-col gap-4">
      <input type="hidden" name="id" value={cliente?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="cliente-nombre" etiqueta="Nombre" errores={errores.campos?.nombre}>
          <Input
            id="cliente-nombre"
            name="nombre"
            defaultValue={cliente?.nombre}
            autoComplete="off"
            autoFocus
            aria-invalid={Boolean(errores.campos?.nombre)}
            className={clase}
          />
        </Campo>
        <Campo id="cliente-apellido" etiqueta="Apellido" errores={errores.campos?.apellido}>
          <Input
            id="cliente-apellido"
            name="apellido"
            defaultValue={cliente?.apellido}
            autoComplete="off"
            aria-invalid={Boolean(errores.campos?.apellido)}
            className={clase}
          />
        </Campo>
      </div>

      <Campo
        id="cliente-telefono"
        etiqueta="Teléfono (opcional)"
        errores={errores.campos?.telefono}
        ayuda="Si se carga, no se puede repetir entre clientes."
      >
        <div className="flex gap-2">
          <select
            name="pais"
            aria-label="País del teléfono"
            defaultValue={telefonoInicial.pais}
            className="h-10 w-36 shrink-0 rounded-md border border-input bg-blanco px-2 text-sm text-texto outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {PAISES.map((pais) => (
              <option key={pais.codigo} value={pais.codigo}>
                {pais.nombre} +{pais.codigo}
              </option>
            ))}
            <option value={OTRO_PAIS}>Otro país</option>
          </select>
          <Input
            id="cliente-telefono"
            name="telefono"
            type="tel"
            inputMode="tel"
            placeholder="0981 123 456"
            defaultValue={telefonoInicial.numero}
            autoComplete="off"
            aria-invalid={Boolean(errores.campos?.telefono)}
            className={clase}
          />
        </div>
      </Campo>

      <Campo id="cliente-notas" etiqueta="Notas (opcional)" errores={errores.campos?.notas}>
        <Textarea
          id="cliente-notas"
          name="notas"
          rows={3}
          defaultValue={cliente?.notas ?? undefined}
          placeholder="Ej. Prefiere turnos a la tarde"
          className="bg-blanco"
        />
      </Campo>

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

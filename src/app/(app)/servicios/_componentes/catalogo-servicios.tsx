"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatearDuracion, formatearFecha, formatearGs } from "@/lib/formato";
import { cambiarEstado, type TablaConEstado } from "../actions";
import {
  FormGrupo,
  FormPaquete,
  FormPromocion,
  FormServicio,
  type DestinoPromocion,
} from "./formularios";
import { estadoPromocion, type Grupo, type Paquete, type Promocion, type Servicio } from "./tipos";

/** Qué formulario está abierto (o ninguno). */
type Dialogo =
  | { tipo: "grupo"; grupo?: Grupo }
  | { tipo: "servicio"; servicio?: Servicio; grupoId?: string }
  | { tipo: "paquete"; servicio: Servicio; paquete?: Paquete }
  | { tipo: "promocion"; destino: DestinoPromocion; descripcion: string; promocion?: Promocion };

type Props = {
  grupos: Grupo[];
  esAdmin: boolean;
  /** Fecha de hoy en Asunción (AAAA-MM-DD), calculada en el servidor. */
  hoy: string;
};

export function CatalogoServicios({ grupos, esAdmin, hoy }: Props) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const visible = <T extends { activo: boolean }>(item: T) => mostrarInactivos || item.activo;
  const gruposVisibles = grupos.filter(visible);
  const vencidas = listarVencidas(grupos, hoy);

  function cerrarYAvisar() {
    setDialogo(null);
    toast.success("Cambios guardados.");
  }

  const contexto: Contexto = { esAdmin, hoy, visible, abrir: setDialogo };

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {esAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDialogo({ tipo: "grupo" })} className="h-10 hover:bg-verde-oliva-claro">
              <Plus /> Grupo
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogo({ tipo: "servicio" })}
              disabled={!grupos.some((g) => g.activo)}
              className="h-10 border-verde-oliva/30 bg-blanco text-verde-oliva"
            >
              <Plus /> Subgrupo
            </Button>
          </div>
        ) : (
          <p className="text-sm text-texto-suave">Solo la administración puede modificar esta sección.</p>
        )}
        <label className="flex items-center gap-2 text-sm text-texto-suave">
          <Switch checked={mostrarInactivos} onCheckedChange={setMostrarInactivos} />
          Mostrar desactivados
        </label>
      </div>

      {/* Grupos */}
      {gruposVisibles.length === 0 ? (
        <EstadoVacio esAdmin={esAdmin} hayInactivos={grupos.length > 0} />
      ) : (
        <Accordion
          multiple
          defaultValue={gruposVisibles.map((g) => g.id)}
          className="flex flex-col gap-3"
        >
          {gruposVisibles.map((grupo) => (
            <TarjetaGrupo key={grupo.id} grupo={grupo} ctx={contexto} />
          ))}
        </Accordion>
      )}

      {/* Promociones vencidas */}
      {vencidas.length > 0 && (
        <section className="rounded-lg border border-border bg-blanco p-4 md:p-6">
          <h2 className="text-2xl text-verde-oliva">Promociones vencidas</h2>
          <p className="mb-4 text-sm text-texto-suave">
            Ya no se aplican. Podés editar sus fechas para volver a usarlas.
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {vencidas.map(({ promocion, descripcion, destino }) => (
              <FilaPromocion
                key={promocion.id}
                promocion={promocion}
                descripcion={descripcion}
                destino={destino}
                ctx={contexto}
                mostrarDescripcion
              />
            ))}
          </ul>
        </section>
      )}

      {/* Formulario abierto */}
      <Dialog open={dialogo !== null} onOpenChange={(abierto) => !abierto && setDialogo(null)}>
        <DialogContent className="bg-crema sm:max-w-md">
          {dialogo && (
            <ContenidoDialogo dialogo={dialogo} grupos={grupos} alGuardar={cerrarYAvisar} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Piezas de la lista
// -----------------------------------------------------------------------------

type Contexto = {
  esAdmin: boolean;
  hoy: string;
  visible: <T extends { activo: boolean }>(item: T) => boolean;
  abrir: (dialogo: Dialogo) => void;
};

function TarjetaGrupo({ grupo, ctx }: { grupo: Grupo; ctx: Contexto }) {
  const servicios = grupo.servicios.filter(ctx.visible);
  const cantidad = grupo.servicios.filter((s) => s.activo).length;

  return (
    <AccordionItem
      value={grupo.id}
      className={cn(
        "rounded-lg border border-border bg-blanco not-last:border-b",
        !grupo.activo && "opacity-60",
      )}
    >
      <AccordionTrigger className="px-4 py-4 hover:no-underline md:px-6">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-heading text-2xl font-medium tracking-wide text-verde-oliva">
            {grupo.nombre}
          </span>
          <span className="font-sans text-xs text-texto-suave">
            {cantidad === 1 ? "1 subgrupo" : `${cantidad} subgrupos`}
          </span>
          {!grupo.activo && <EtiquetaInactivo />}
        </span>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 md:px-6">
        {ctx.esAdmin && (
          <div className="mb-3 flex flex-wrap gap-1 border-b border-border pb-3">
            <BotonAccion onClick={() => ctx.abrir({ tipo: "servicio", grupoId: grupo.id })} disabled={!grupo.activo}>
              <Plus /> Subgrupo
            </BotonAccion>
            <BotonAccion onClick={() => ctx.abrir({ tipo: "grupo", grupo })}>
              <Pencil /> Editar grupo
            </BotonAccion>
            <BotonEstado tabla="grupos" id={grupo.id} activo={grupo.activo} />
          </div>
        )}

        {servicios.length === 0 ? (
          <p className="py-2 text-sm text-texto-suave">Este grupo todavía no tiene subgrupos.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {servicios.map((servicio) => (
              <FilaServicio key={servicio.id} servicio={servicio} ctx={ctx} />
            ))}
          </ul>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function FilaServicio({ servicio, ctx }: { servicio: Servicio; ctx: Contexto }) {
  const paquetes = servicio.paquetes.filter(ctx.visible);
  const promociones = servicio.promociones.filter(
    (p) => ctx.visible(p) && estadoPromocion(p, ctx.hoy) !== "vencida",
  );

  return (
    <li className={cn("py-3", !servicio.activo && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-base text-texto">{servicio.nombre}</span>
          <span className="text-sm text-texto">{formatearGs(servicio.precio)}</span>
          <span className="text-sm text-texto-suave">{formatearDuracion(servicio.duracion_min)}</span>
          {servicio.permite_dos_clientes && (
            <Badge variant="outline" className="border-dorado text-texto">
              2 a la vez
            </Badge>
          )}
          {servicio.visible_web && <Badge variant="outline">Web</Badge>}
          {!servicio.activo && <EtiquetaInactivo />}
        </div>
        {ctx.esAdmin && (
          <div className="flex flex-wrap gap-1">
            <BotonAccion onClick={() => ctx.abrir({ tipo: "servicio", servicio })}>
              <Pencil /> Editar
            </BotonAccion>
            <BotonAccion onClick={() => ctx.abrir({ tipo: "paquete", servicio })}>
              <Plus /> Paquete
            </BotonAccion>
            <BotonAccion
              onClick={() =>
                ctx.abrir({
                  tipo: "promocion",
                  destino: { servicioId: servicio.id },
                  descripcion: servicio.nombre,
                })
              }
            >
              <Plus /> Promoción
            </BotonAccion>
            <BotonEstado tabla="servicios" id={servicio.id} activo={servicio.activo} />
          </div>
        )}
      </div>

      {(paquetes.length > 0 || promociones.length > 0) && (
        <ul className="mt-2 flex flex-col gap-1 border-l-2 border-dorado/40 pl-3 md:ml-2">
          {promociones.map((promocion) => (
            <FilaPromocion
              key={promocion.id}
              promocion={promocion}
              descripcion={servicio.nombre}
              destino={{ servicioId: servicio.id }}
              ctx={ctx}
            />
          ))}
          {paquetes.map((paquete) => (
            <FilaPaquete key={paquete.id} paquete={paquete} servicio={servicio} ctx={ctx} />
          ))}
        </ul>
      )}
    </li>
  );
}

function FilaPaquete({ paquete, servicio, ctx }: { paquete: Paquete; servicio: Servicio; ctx: Contexto }) {
  const descripcion = `${servicio.nombre} · ${paquete.sesiones} sesiones`;
  const promociones = paquete.promociones.filter(
    (p) => ctx.visible(p) && estadoPromocion(p, ctx.hoy) !== "vencida",
  );

  return (
    <li className={cn(!paquete.activo && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-2 py-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="text-texto-suave">Paquete</span>
          <span>{paquete.sesiones} sesiones</span>
          <span>{formatearGs(paquete.precio)}</span>
          {!paquete.activo && <EtiquetaInactivo />}
        </div>
        {ctx.esAdmin && (
          <div className="flex flex-wrap gap-1">
            <BotonAccion onClick={() => ctx.abrir({ tipo: "paquete", servicio, paquete })}>
              <Pencil /> Editar
            </BotonAccion>
            <BotonAccion
              onClick={() =>
                ctx.abrir({ tipo: "promocion", destino: { paqueteId: paquete.id }, descripcion })
              }
            >
              <Plus /> Promoción
            </BotonAccion>
            <BotonEstado tabla="paquetes" id={paquete.id} activo={paquete.activo} />
          </div>
        )}
      </div>
      {promociones.length > 0 && (
        <ul className="ml-3 border-l border-dorado/30 pl-3">
          {promociones.map((promocion) => (
            <FilaPromocion
              key={promocion.id}
              promocion={promocion}
              descripcion={descripcion}
              destino={{ paqueteId: paquete.id }}
              ctx={ctx}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

const ETIQUETA_ESTADO_PROMO = {
  vigente: { texto: "Vigente", clase: "border-verde-oliva/40 text-verde-oliva" },
  proxima: { texto: "Próxima", clase: "border-dorado text-texto" },
  vencida: { texto: "Vencida", clase: "border-alerta/40 text-alerta" },
  inactiva: { texto: "Desactivada", clase: "border-border text-texto-suave" },
} as const;

function FilaPromocion({
  promocion,
  descripcion,
  destino,
  ctx,
  mostrarDescripcion = false,
}: {
  promocion: Promocion;
  descripcion: string;
  destino: DestinoPromocion;
  ctx: Contexto;
  /** En la lista de vencidas se aclara de qué subgrupo o paquete es. */
  mostrarDescripcion?: boolean;
}) {
  const estado = ETIQUETA_ESTADO_PROMO[estadoPromocion(promocion, ctx.hoy)];

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-1">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="text-texto-suave">Promoción</span>
        {mostrarDescripcion && <span>{descripcion}</span>}
        <span>{formatearGs(promocion.precio)}</span>
        <span className="text-texto-suave">
          {formatearFecha(promocion.inicio)} al {formatearFecha(promocion.fin)}
        </span>
        <Badge variant="outline" className={estado.clase}>
          {estado.texto}
        </Badge>
      </div>
      {ctx.esAdmin && (
        <div className="flex flex-wrap gap-1">
          <BotonAccion
            onClick={() => ctx.abrir({ tipo: "promocion", destino, descripcion, promocion })}
          >
            <Pencil /> Editar
          </BotonAccion>
          <BotonEstado tabla="promociones" id={promocion.id} activo={promocion.activo} />
        </div>
      )}
    </li>
  );
}

// -----------------------------------------------------------------------------
// Botones y estados
// -----------------------------------------------------------------------------

function BotonAccion({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 text-verde-oliva hover:bg-crema hover:text-verde-oliva"
    >
      {children}
    </Button>
  );
}

/** Desactiva o reactiva un registro y avisa el resultado. */
function BotonEstado({ tabla, id, activo }: { tabla: TablaConEstado; id: string; activo: boolean }) {
  const [cambiando, iniciarTransicion] = useTransition();

  function alternar() {
    iniciarTransicion(async () => {
      const respuesta = await cambiarEstado(tabla, id, !activo);
      if (respuesta.ok) toast.success(activo ? "Desactivado." : "Reactivado.");
      else toast.error(respuesta.error ?? "No se pudo cambiar el estado.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={alternar}
      disabled={cambiando}
      className={cn(
        "h-8",
        activo ? "text-texto-suave hover:bg-alerta/5 hover:text-alerta" : "text-verde-oliva hover:bg-crema",
      )}
    >
      {activo ? "Desactivar" : "Reactivar"}
    </Button>
  );
}

function EtiquetaInactivo() {
  return (
    <Badge variant="outline" className="border-border text-texto-suave">
      Desactivado
    </Badge>
  );
}

function EstadoVacio({ esAdmin, hayInactivos }: { esAdmin: boolean; hayInactivos: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-dorado/50 bg-blanco px-6 py-12 text-center">
      <p className="font-heading text-2xl text-verde-oliva">Todavía no hay servicios</p>
      <p className="mt-2 text-sm text-texto-suave">
        {hayInactivos
          ? "Todos los grupos están desactivados. Activá \"Mostrar desactivados\" para verlos."
          : esAdmin
            ? "Empezá creando un grupo (por ejemplo \"Masajes\") con el botón \"+ Grupo\"."
            : "La administración todavía no cargó los servicios."}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Contenido de la ventana según el formulario abierto
// -----------------------------------------------------------------------------

function ContenidoDialogo({
  dialogo,
  grupos,
  alGuardar,
}: {
  dialogo: Dialogo;
  grupos: Grupo[];
  alGuardar: () => void;
}) {
  switch (dialogo.tipo) {
    case "grupo":
      return (
        <>
          <Encabezado titulo={dialogo.grupo ? "Editar grupo" : "Nuevo grupo"} />
          <FormGrupo grupo={dialogo.grupo} alGuardar={alGuardar} />
        </>
      );
    case "servicio":
      return (
        <>
          <Encabezado
            titulo={dialogo.servicio ? "Editar subgrupo" : "Nuevo subgrupo"}
            descripcion="Es el servicio que se agenda: nombre, precio y duración."
          />
          <FormServicio
            servicio={dialogo.servicio}
            grupoIdInicial={dialogo.grupoId}
            grupos={grupos}
            alGuardar={alGuardar}
          />
        </>
      );
    case "paquete":
      return (
        <>
          <Encabezado
            titulo={dialogo.paquete ? "Editar paquete" : "Nuevo paquete"}
            descripcion={dialogo.servicio.nombre}
          />
          <FormPaquete
            servicioId={dialogo.servicio.id}
            paquete={dialogo.paquete}
            alGuardar={alGuardar}
          />
        </>
      );
    case "promocion":
      return (
        <>
          <Encabezado
            titulo={dialogo.promocion ? "Editar promoción" : "Nueva promoción"}
            descripcion={dialogo.descripcion}
          />
          <FormPromocion
            destino={dialogo.destino}
            promocion={dialogo.promocion}
            alGuardar={alGuardar}
          />
        </>
      );
  }
}

function Encabezado({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <DialogHeader>
      <DialogTitle className="text-2xl text-verde-oliva">{titulo}</DialogTitle>
      {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
    </DialogHeader>
  );
}

// -----------------------------------------------------------------------------
// Utilidades
// -----------------------------------------------------------------------------

/** Junta todas las promociones vencidas (de subgrupos y de paquetes) para su sección. */
function listarVencidas(grupos: Grupo[], hoy: string) {
  return grupos.flatMap((grupo) =>
    grupo.servicios.flatMap((servicio) => [
      ...servicio.promociones
        .filter((p) => estadoPromocion(p, hoy) === "vencida")
        .map((promocion) => ({
          promocion,
          descripcion: `${grupo.nombre} · ${servicio.nombre}`,
          destino: { servicioId: servicio.id } as DestinoPromocion,
        })),
      ...servicio.paquetes.flatMap((paquete) =>
        paquete.promociones
          .filter((p) => estadoPromocion(p, hoy) === "vencida")
          .map((promocion) => ({
            promocion,
            descripcion: `${grupo.nombre} · ${servicio.nombre} · ${paquete.sesiones} sesiones`,
            destino: { paqueteId: paquete.id } as DestinoPromocion,
          })),
      ),
    ]),
  );
}

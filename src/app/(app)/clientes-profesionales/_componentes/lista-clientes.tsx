"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormCliente } from "@/components/clientes/form-cliente";
import { cn } from "@/lib/utils";
import { formatearTelefono } from "@/lib/telefono";
import { cambiarEstadoCliente, guardarCliente } from "../actions";
import type { Cliente } from "./tipos";

type Props = {
  clientes: Cliente[];
  total: number;
  busqueda: string;
  mostrarInactivos: boolean;
  esAdmin: boolean;
};

export function ListaClientes({ clientes, total, busqueda, mostrarInactivos, esAdmin }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [buscando, iniciarTransicion] = useTransition();
  const [texto, setTexto] = useState(busqueda);
  // undefined = cerrado; null = cliente nuevo; Cliente = editar
  const [editando, setEditando] = useState<Cliente | null | undefined>(undefined);

  /** Actualiza la dirección (?q=…&inactivos=1) y el servidor devuelve la lista filtrada. */
  function actualizarFiltros(cambios: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    iniciarTransicion(() => router.replace(`${pathname}?${params}`, { scroll: false }));
  }

  // Busca mientras se escribe, esperando 300 ms desde la última tecla.
  useEffect(() => {
    if (texto.trim() === busqueda) return;
    const espera = setTimeout(() => actualizarFiltros({ q: texto.trim() || null }), 300);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar al texto
  }, [texto]);

  function alGuardar() {
    setEditando(undefined);
    toast.success("Cliente guardado.");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-texto-suave" />
          <Input
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder="Buscar por nombre, apellido o teléfono"
            aria-label="Buscar clientes"
            autoComplete="off"
            className="h-10 bg-blanco pl-9"
          />
        </div>
        <Button onClick={() => setEditando(null)} className="h-10 hover:bg-verde-oliva-claro">
          <Plus /> Nuevo cliente
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-texto-suave">
        <span aria-live="polite">
          {buscando
            ? "Buscando…"
            : total === 0
              ? ""
              : total > clientes.length
                ? `Mostrando ${clientes.length} de ${total}. Escribí para afinar la búsqueda.`
                : total === 1
                  ? "1 cliente"
                  : `${total} clientes`}
        </span>
        <label className="flex items-center gap-2">
          <Switch
            checked={mostrarInactivos}
            onCheckedChange={(valor) => actualizarFiltros({ inactivos: valor ? "1" : null })}
          />
          Mostrar desactivados
        </label>
      </div>

      {clientes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-dorado/50 bg-blanco px-6 py-12 text-center">
          <p className="font-heading text-2xl text-verde-oliva">
            {busqueda ? "Sin resultados" : "Todavía no hay clientes"}
          </p>
          <p className="mt-2 text-sm text-texto-suave">
            {busqueda
              ? `No encontramos clientes con "${busqueda}".`
              : "Cargá el primero con el botón \"+ Nuevo cliente\"."}
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            "flex flex-col divide-y divide-border rounded-lg border border-border bg-blanco transition-opacity",
            buscando && "opacity-60",
          )}
        >
          {clientes.map((cliente) => (
            <FilaCliente
              key={cliente.id}
              cliente={cliente}
              esAdmin={esAdmin}
              alEditar={() => setEditando(cliente)}
            />
          ))}
        </ul>
      )}

      <Dialog
        open={editando !== undefined}
        onOpenChange={(abierto) => !abierto && setEditando(undefined)}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-crema sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-verde-oliva">
              {editando ? "Editar cliente" : "Nuevo cliente"}
            </DialogTitle>
          </DialogHeader>
          {editando !== undefined && (
            <FormCliente
              cliente={editando ?? undefined}
              guardar={guardarCliente}
              alGuardar={alGuardar}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilaCliente({
  cliente,
  esAdmin,
  alEditar,
}: {
  cliente: Cliente;
  esAdmin: boolean;
  alEditar: () => void;
}) {
  const [cambiando, iniciarTransicion] = useTransition();

  function alternarEstado() {
    iniciarTransicion(async () => {
      const resultado = await cambiarEstadoCliente(cliente.id, !cliente.activo);
      if (resultado.ok) toast.success(cliente.activo ? "Cliente desactivado." : "Cliente reactivado.");
      else toast.error(resultado.error ?? "No se pudo cambiar el estado.");
    });
  }

  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3",
        !cliente.activo && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-2 text-base text-texto">
          {cliente.nombre} {cliente.apellido}
          {!cliente.activo && (
            <Badge variant="outline" className="border-border text-texto-suave">
              Desactivado
            </Badge>
          )}
        </span>
        <span className="text-sm text-texto-suave">
          {cliente.telefono ? formatearTelefono(cliente.telefono) : "Sin teléfono"}
        </span>
        {cliente.notas && (
          <span className="truncate text-xs text-texto-suave" title={cliente.notas}>
            {cliente.notas}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={alEditar}
          className="h-8 text-verde-oliva hover:bg-crema hover:text-verde-oliva"
        >
          <Pencil /> Editar
        </Button>
        {esAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={alternarEstado}
            disabled={cambiando}
            className={cn(
              "h-8",
              cliente.activo
                ? "text-texto-suave hover:bg-alerta/5 hover:text-alerta"
                : "text-verde-oliva hover:bg-crema",
            )}
          >
            {cliente.activo ? "Desactivar" : "Reactivar"}
          </Button>
        )}
      </div>
    </li>
  );
}

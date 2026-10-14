import type { Metadata } from "next";
import { EncabezadoSeccion } from "@/components/layout/encabezado-seccion";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { hoyEnAsuncion } from "@/lib/formato";
import { createClient } from "@/lib/supabase/server";
import { CatalogoServicios } from "./_componentes/catalogo-servicios";
import type { Grupo } from "./_componentes/tipos";

export const metadata: Metadata = {
  title: "Servicios y precios",
};

/** Orden de la lista: primero por "orden" y después alfabético. */
function porOrdenYNombre<T extends { orden: number; nombre: string }>(a: T, b: T) {
  return a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es");
}

export default async function ServiciosPage() {
  const supabase = await createClient();
  const [perfil, { data, error }] = await Promise.all([
    obtenerPerfilActual(),
    supabase.from("grupos").select(`
      id, nombre, orden, activo,
      servicios (
        id, grupo_id, nombre, duracion_min, precio, activo, visible_web, permite_dos_clientes, orden,
        promociones ( id, servicio_id, paquete_id, precio, inicio, fin, activo ),
        paquetes (
          id, servicio_id, sesiones, precio, activo,
          promociones ( id, servicio_id, paquete_id, precio, inicio, fin, activo )
        )
      )
    `),
  ]);

  if (error) {
    throw new Error("No se pudieron cargar los servicios.");
  }

  const grupos: Grupo[] = (data ?? []).sort(porOrdenYNombre).map((grupo) => ({
    ...grupo,
    servicios: grupo.servicios.sort(porOrdenYNombre).map((servicio) => ({
      ...servicio,
      promociones: servicio.promociones.sort((a, b) => a.inicio.localeCompare(b.inicio)),
      paquetes: servicio.paquetes
        .sort((a, b) => a.sesiones - b.sesiones)
        .map((paquete) => ({
          ...paquete,
          promociones: paquete.promociones.sort((a, b) => a.inicio.localeCompare(b.inicio)),
        })),
    })),
  }));

  return (
    <>
      <EncabezadoSeccion
        titulo="Servicios y precios"
        descripcion="Grupos y subgrupos que se agendan, con sus paquetes y promociones."
      />
      <CatalogoServicios grupos={grupos} esAdmin={perfil?.rol === "admin"} hoy={hoyEnAsuncion()} />
    </>
  );
}

import type { Metadata } from "next";
import { EncabezadoSeccion } from "@/components/layout/encabezado-seccion";
import { obtenerPerfilActual } from "@/lib/auth/perfil";
import { palabrasDeBusqueda } from "@/lib/busqueda";
import { createClient } from "@/lib/supabase/server";
import { HorarioSpa } from "./_componentes/horario-spa";
import { ListaClientes } from "./_componentes/lista-clientes";
import { ListaProfesionales } from "./_componentes/lista-profesionales";
import { Pestanas } from "./_componentes/pestanas";
import type { CuentaAcceso, GrupoServicios, Pestana, Profesional } from "./_componentes/tipos";

export const metadata: Metadata = {
  title: "Clientes y profesionales",
};

/** Cuántos clientes se muestran como máximo (con el buscador se encuentra el resto). */
const LIMITE_CLIENTES = 50;

function texto(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? "";
}

export default async function ClientesProfesionalesPage({
  searchParams,
}: PageProps<"/clientes-profesionales">) {
  const params = await searchParams;
  const pestana: Pestana = (["clientes", "profesionales", "horario"] as const).includes(
    texto(params.tab) as Pestana,
  )
    ? (texto(params.tab) as Pestana)
    : "clientes";
  const busqueda = texto(params.q).trim();
  const mostrarInactivos = texto(params.inactivos) === "1";

  const supabase = await createClient();
  const perfil = await obtenerPerfilActual();
  const esAdmin = perfil?.rol === "admin";

  // Clientes: búsqueda por palabras sobre la columna "busqueda" (sin tildes).
  let consultaClientes = supabase
    .from("clientes")
    .select("id, nombre, apellido, telefono, notas, activo", { count: "exact" })
    .order("apellido")
    .order("nombre")
    .limit(LIMITE_CLIENTES);
  if (!mostrarInactivos) consultaClientes = consultaClientes.eq("activo", true);
  for (const palabra of palabrasDeBusqueda(busqueda)) {
    consultaClientes = consultaClientes.ilike("busqueda", `%${palabra}%`);
  }

  const [clientes, profesionales, grupos, horarioSpa, cuentas] = await Promise.all([
    consultaClientes,
    supabase
      .from("profesionales")
      .select(
        "id, nombre, apellido, color, activa, horarios_profesional (dia_semana, inicio, fin), profesional_grupos (grupo_id), perfiles (id, nombre)",
      )
      .order("nombre"),
    supabase
      .from("grupos")
      .select("id, nombre, orden, activo, servicios (id, nombre, orden, activo)")
      .eq("activo", true)
      .order("orden")
      .order("nombre"),
    supabase.from("horario_spa").select("dia_semana, apertura, cierre"),
    esAdmin
      ? supabase.from("perfiles").select("id, nombre, rol, profesional_id").eq("activo", true).order("nombre")
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = clientes.error ?? profesionales.error ?? grupos.error ?? horarioSpa.error ?? cuentas.error;
  if (error) throw new Error("No se pudieron cargar los datos.");

  const listaProfesionales: Profesional[] = (profesionales.data ?? []).map((p) => {
    const cuenta = Array.isArray(p.perfiles) ? p.perfiles[0] : p.perfiles;
    return {
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      color: p.color,
      activa: p.activa,
      horarios: p.horarios_profesional,
      grupoIds: p.profesional_grupos.map((pg) => pg.grupo_id),
      cuenta: cuenta ? { id: cuenta.id, nombre: cuenta.nombre } : null,
    };
  });

  const gruposServicios: GrupoServicios[] = (grupos.data ?? []).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    servicios: g.servicios
      .filter((s) => s.activo)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"))
      .map((s) => s.nombre),
  }));

  const cuentasAcceso: CuentaAcceso[] = (cuentas.data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    rol: c.rol,
    profesionalId: c.profesional_id,
  }));

  return (
    <>
      <EncabezadoSeccion
        titulo="Clientes y profesionales"
        descripcion="Fichas de clientes y profesionales, sus horarios y el horario del spa."
      />
      <Pestanas
        activa={pestana}
        paneles={{
          clientes: (
            <ListaClientes
              clientes={clientes.data ?? []}
              total={clientes.count ?? 0}
              busqueda={busqueda}
              mostrarInactivos={mostrarInactivos}
              esAdmin={esAdmin}
            />
          ),
          profesionales: (
            <ListaProfesionales
              profesionales={listaProfesionales}
              grupos={gruposServicios}
              cuentas={cuentasAcceso}
              esAdmin={esAdmin}
              miProfesionalId={perfil?.profesionalId ?? null}
            />
          ),
          horario: (
            <HorarioSpa
              rangos={(horarioSpa.data ?? []).map((h) => ({
                dia_semana: h.dia_semana,
                inicio: h.apertura,
                fin: h.cierre,
              }))}
              esAdmin={esAdmin}
            />
          ),
        }}
      />
    </>
  );
}

-- =============================================================================
-- Seguridad por filas (RLS). Ver CLAUDE.md §3 y §6.
--
-- Regla general: RLS activado en TODAS las tablas; sin una política que lo
-- permita, no se puede leer ni escribir nada.
--
--   * Público anónimo (sin login): sin acceso a nada. Cuando exista la web
--     pública se abrirá, con cuidado, solo lo necesario.
--   * Usuario con perfil activo: puede leer todo.
--   * admin: puede crear y modificar todo.
--   * profesional: crea y modifica cualquier turno; crea y edita clientes
--     (desactivarlos es solo de admin, ver trigger en personas.sql); edita su
--     propio horario semanal.
--   * Nadie borra turnos, clientes, profesionales ni servicios: se desactivan.
--
-- Las funciones van entre (select …) para que Postgres las evalúe una sola vez
-- por consulta y no una vez por fila.
-- =============================================================================

alter table public.perfiles enable row level security;
alter table public.horario_spa enable row level security;
alter table public.boxes enable row level security;
alter table public.profesionales enable row level security;
alter table public.horarios_profesional enable row level security;
alter table public.clientes enable row level security;
alter table public.grupos enable row level security;
alter table public.servicios enable row level security;
alter table public.profesional_servicios enable row level security;
alter table public.paquetes enable row level security;
alter table public.promociones enable row level security;
alter table public.turnos enable row level security;

-- Doble seguro: el rol anónimo ni siquiera tiene permiso sobre las tablas.
revoke all on
  public.perfiles, public.horario_spa, public.boxes, public.profesionales,
  public.horarios_profesional, public.clientes, public.grupos, public.servicios,
  public.profesional_servicios, public.paquetes, public.promociones, public.turnos
from anon;

-- -----------------------------------------------------------------------------
-- Perfiles: cada uno ve el suyo; admin ve y edita todos (roles, activo, etc.).
-- Los perfiles se crean solos (trigger) y se borran junto con el usuario de Auth.
-- -----------------------------------------------------------------------------
create policy "perfiles: ver el propio o admin ve todos"
  on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or (select public.es_admin()));

create policy "perfiles: admin edita"
  on public.perfiles for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- -----------------------------------------------------------------------------
-- Tablas de configuración que solo edita admin y todos los usuarios activos leen.
-- -----------------------------------------------------------------------------

-- horario_spa (admin también puede borrar rangos: no tienen historial)
create policy "horario_spa: usuarios activos leen"
  on public.horario_spa for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "horario_spa: admin crea"
  on public.horario_spa for insert to authenticated
  with check ((select public.es_admin()));
create policy "horario_spa: admin edita"
  on public.horario_spa for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "horario_spa: admin borra"
  on public.horario_spa for delete to authenticated
  using ((select public.es_admin()));

-- boxes
create policy "boxes: usuarios activos leen"
  on public.boxes for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "boxes: admin crea"
  on public.boxes for insert to authenticated
  with check ((select public.es_admin()));
create policy "boxes: admin edita"
  on public.boxes for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- profesionales
create policy "profesionales: usuarios activos leen"
  on public.profesionales for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "profesionales: admin crea"
  on public.profesionales for insert to authenticated
  with check ((select public.es_admin()));
create policy "profesionales: admin edita"
  on public.profesionales for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- grupos
create policy "grupos: usuarios activos leen"
  on public.grupos for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "grupos: admin crea"
  on public.grupos for insert to authenticated
  with check ((select public.es_admin()));
create policy "grupos: admin edita"
  on public.grupos for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- servicios
create policy "servicios: usuarios activos leen"
  on public.servicios for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "servicios: admin crea"
  on public.servicios for insert to authenticated
  with check ((select public.es_admin()));
create policy "servicios: admin edita"
  on public.servicios for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- profesional_servicios (es una lista: se agregan y quitan filas)
create policy "profesional_servicios: usuarios activos leen"
  on public.profesional_servicios for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "profesional_servicios: admin agrega"
  on public.profesional_servicios for insert to authenticated
  with check ((select public.es_admin()));
create policy "profesional_servicios: admin quita"
  on public.profesional_servicios for delete to authenticated
  using ((select public.es_admin()));

-- paquetes
create policy "paquetes: usuarios activos leen"
  on public.paquetes for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "paquetes: admin crea"
  on public.paquetes for insert to authenticated
  with check ((select public.es_admin()));
create policy "paquetes: admin edita"
  on public.paquetes for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- promociones
create policy "promociones: usuarios activos leen"
  on public.promociones for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "promociones: admin crea"
  on public.promociones for insert to authenticated
  with check ((select public.es_admin()));
create policy "promociones: admin edita"
  on public.promociones for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- -----------------------------------------------------------------------------
-- Horarios de profesionales: admin edita todos; cada profesional, el suyo.
-- Se pueden borrar rangos (al editar el horario se reemplazan).
-- -----------------------------------------------------------------------------
create policy "horarios_profesional: usuarios activos leen"
  on public.horarios_profesional for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "horarios_profesional: admin o la propia profesional crea"
  on public.horarios_profesional for insert to authenticated
  with check (
    (select public.es_admin())
    or profesional_id = (select public.mi_profesional_id())
  );
create policy "horarios_profesional: admin o la propia profesional edita"
  on public.horarios_profesional for update to authenticated
  using (
    (select public.es_admin())
    or profesional_id = (select public.mi_profesional_id())
  )
  with check (
    (select public.es_admin())
    or profesional_id = (select public.mi_profesional_id())
  );
create policy "horarios_profesional: admin o la propia profesional borra"
  on public.horarios_profesional for delete to authenticated
  using (
    (select public.es_admin())
    or profesional_id = (select public.mi_profesional_id())
  );

-- -----------------------------------------------------------------------------
-- Clientes: todos los usuarios activos leen, crean y editan.
-- Desactivar/reactivar: solo admin (trigger clientes_validar_cambio_activo).
-- -----------------------------------------------------------------------------
create policy "clientes: usuarios activos leen"
  on public.clientes for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "clientes: usuarios activos crean"
  on public.clientes for insert to authenticated
  with check (
    (select public.es_usuario_activo())
    and creado_por = (select auth.uid())
    and (activo or (select public.es_admin()))
  );
create policy "clientes: usuarios activos editan"
  on public.clientes for update to authenticated
  using ((select public.es_usuario_activo()))
  with check ((select public.es_usuario_activo()));

-- -----------------------------------------------------------------------------
-- Turnos: todos los usuarios activos leen, crean y modifican cualquier turno.
-- No se borran: se cancelan (estado = 'cancelado').
-- -----------------------------------------------------------------------------
create policy "turnos: usuarios activos leen"
  on public.turnos for select to authenticated
  using ((select public.es_usuario_activo()));
create policy "turnos: usuarios activos crean"
  on public.turnos for insert to authenticated
  with check (
    (select public.es_usuario_activo())
    and creado_por = (select auth.uid())
    and origen = 'interno'
  );
create policy "turnos: usuarios activos modifican"
  on public.turnos for update to authenticated
  using ((select public.es_usuario_activo()))
  with check ((select public.es_usuario_activo()));

-- -----------------------------------------------------------------------------
-- Datos de origen que no se pueden cambiar después de crear el registro
-- (quién lo creó y, en turnos, si vino de la agenda interna o de la web).
-- Desde el panel de Supabase (sin usuario logueado) sí se pueden corregir.
-- -----------------------------------------------------------------------------
create function public.conservar_datos_de_creacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.creado_por := old.creado_por;
    new.created_at := old.created_at;
    if tg_table_name = 'turnos' then
      new.origen := old.origen;
    end if;
  end if;
  return new;
end;
$$;

create trigger clientes_conservar_datos_de_creacion before update on public.clientes
  for each row execute function public.conservar_datos_de_creacion();
create trigger turnos_conservar_datos_de_creacion before update on public.turnos
  for each row execute function public.conservar_datos_de_creacion();

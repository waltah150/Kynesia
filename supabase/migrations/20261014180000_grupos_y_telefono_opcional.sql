-- =============================================================================
-- Ajustes pedidos al probar la Fase 4:
--   1. Las profesionales realizan GRUPOS de servicios (ej. "Masajes"), no
--      subgrupos sueltos. Así, un subgrupo nuevo de un grupo queda disponible
--      automáticamente para quienes hacen ese grupo.
--   2. El teléfono del cliente pasa a ser opcional (sigue sin poder repetirse).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profesional_servicios → profesional_grupos
-- -----------------------------------------------------------------------------
create table public.profesional_grupos (
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (profesional_id, grupo_id)
);

comment on table public.profesional_grupos is
  'Qué grupos de servicios realiza cada profesional (incluye todos sus subgrupos).';

create index profesional_grupos_grupo_idx on public.profesional_grupos (grupo_id);

-- Lo que ya estaba cargado: si hacía algún servicio de un grupo, hace el grupo.
insert into public.profesional_grupos (profesional_id, grupo_id)
select distinct ps.profesional_id, s.grupo_id
from public.profesional_servicios ps
join public.servicios s on s.id = ps.servicio_id;

alter table public.profesional_grupos enable row level security;
revoke all on public.profesional_grupos from anon;

create policy "profesional_grupos: usuarios activos leen"
  on public.profesional_grupos for select to authenticated
  using ((select privado.es_usuario_activo()));
create policy "profesional_grupos: admin agrega"
  on public.profesional_grupos for insert to authenticated
  with check ((select privado.es_admin()));
create policy "profesional_grupos: admin quita"
  on public.profesional_grupos for delete to authenticated
  using ((select privado.es_admin()));

drop function public.guardar_profesional(uuid, text, text, text, boolean, uuid[], uuid);
drop table public.profesional_servicios;

-- Igual que antes, pero con grupos en lugar de servicios.
create function public.guardar_profesional(
  p_id uuid,
  p_nombre text,
  p_apellido text,
  p_color text,
  p_activa boolean,
  p_grupos uuid[],
  p_perfil_id uuid
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not privado.es_admin() then
    raise exception 'Solo un administrador puede editar profesionales.'
      using errcode = '42501';
  end if;

  if p_id is null then
    insert into public.profesionales (nombre, apellido, color, activa)
    values (p_nombre, p_apellido, p_color, p_activa)
    returning id into v_id;
  else
    update public.profesionales
    set nombre = p_nombre, apellido = p_apellido, color = p_color, activa = p_activa
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'La profesional ya no existe.' using errcode = 'P0002';
    end if;
  end if;

  -- Grupos que realiza: se quitan los desmarcados y se agregan los nuevos.
  delete from public.profesional_grupos
  where profesional_id = v_id
    and grupo_id <> all (coalesce(p_grupos, '{}'));

  insert into public.profesional_grupos (profesional_id, grupo_id)
  select v_id, g from unnest(coalesce(p_grupos, '{}')) as g
  on conflict do nothing;

  -- Cuenta de acceso: una sola por profesional. Si la cuenta elegida estaba
  -- vinculada a otra profesional, pasa a esta.
  update public.perfiles
  set profesional_id = null
  where profesional_id = v_id and id is distinct from p_perfil_id;

  if p_perfil_id is not null then
    update public.perfiles set profesional_id = v_id where id = p_perfil_id;
    if not found then
      raise exception 'La cuenta de acceso elegida no existe.' using errcode = 'P0002';
    end if;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.guardar_profesional(uuid, text, text, text, boolean, uuid[], uuid) from public, anon;
grant execute on function public.guardar_profesional(uuid, text, text, text, boolean, uuid[], uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Teléfono opcional
-- -----------------------------------------------------------------------------
alter table public.clientes alter column telefono drop not null;

-- La columna de búsqueda se rearma para que funcione sin teléfono
-- (en SQL, texto || null da null).
drop index public.clientes_busqueda_idx;
alter table public.clientes drop column busqueda;
alter table public.clientes
  add column busqueda text
  generated always as (
    privado.sin_acentos(nombre || ' ' || apellido || ' ' || coalesce(telefono, ''))
  ) stored;
create index clientes_busqueda_idx on public.clientes using gin (busqueda extensions.gin_trgm_ops);

comment on column public.clientes.telefono is
  'Opcional. Formato internacional sin espacios (+595…). Si se carga, no puede repetirse.';

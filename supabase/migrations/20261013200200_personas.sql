-- =============================================================================
-- Personas: perfiles de las usuarias de la app y clientes del spa.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfiles: uno por cada usuario de Supabase Auth.
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'profesional',
  -- Si la usuaria es una profesional, a cuál de la tabla profesionales corresponde.
  profesional_id uuid unique references public.profesionales (id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.perfiles is 'Rol y datos de cada usuario de login. Se crea solo al crear el usuario en Supabase Auth.';

create trigger perfiles_updated_at before update on public.perfiles
  for each row execute function public.actualizar_updated_at();

-- Crea el perfil automáticamente cuando se crea un usuario en Supabase Auth.
-- Por seguridad, todo usuario nuevo empieza como "profesional"; un admin lo cambia si hace falta.
create function public.crear_perfil_para_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), new.email));
  return new;
end;
$$;

create trigger crear_perfil_al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario_nuevo();

-- Perfiles para los usuarios que ya existían antes de esta migración.
insert into public.perfiles (id, nombre)
select id, email from auth.users
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Funciones que usan las reglas de seguridad (RLS).
-- security definer: leen perfiles sin quedar bloqueadas por el propio RLS de perfiles.
-- -----------------------------------------------------------------------------

-- ¿La persona logueada tiene un perfil activo?
create function public.es_usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and activo
  );
$$;

-- ¿La persona logueada es admin (y está activa)?
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and activo and rol = 'admin'
  );
$$;

-- Profesional asociada a la persona logueada (null si no tiene).
create function public.mi_profesional_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profesional_id from public.perfiles
  where id = (select auth.uid()) and activo;
$$;

-- Solo usuarios logueados pueden llamarlas (no el público anónimo).
revoke execute on function public.es_usuario_activo() from public, anon;
revoke execute on function public.es_admin() from public, anon;
revoke execute on function public.mi_profesional_id() from public, anon;
grant execute on function public.es_usuario_activo() to authenticated;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.mi_profesional_id() to authenticated;

-- La función del trigger no debe poder llamarse desde la API.
revoke execute on function public.crear_perfil_para_usuario_nuevo() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Clientes.
-- -----------------------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  -- Normalizado por la app al formato internacional: +595981123456
  telefono text not null unique,
  notas text,
  activo boolean not null default true,
  creado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint clientes_nombre_no_vacio check (length(trim(nombre)) > 0),
  constraint clientes_apellido_no_vacio check (length(trim(apellido)) > 0),
  constraint clientes_telefono_formato check (telefono ~ '^\+[1-9][0-9]{7,14}$')
);

comment on column public.clientes.telefono is 'Formato internacional sin espacios (+595…). Único para evitar clientes duplicados.';

create trigger clientes_updated_at before update on public.clientes
  for each row execute function public.actualizar_updated_at();

-- Las profesionales pueden editar clientes, pero solo un admin puede desactivarlos o reactivarlos.
create function public.validar_cambio_activo_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.activo is distinct from old.activo
     and (select auth.uid()) is not null
     and not public.es_admin() then
    raise exception 'Solo un administrador puede desactivar o reactivar clientes.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger clientes_validar_cambio_activo before update on public.clientes
  for each row execute function public.validar_cambio_activo_cliente();

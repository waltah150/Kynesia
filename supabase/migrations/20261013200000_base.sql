-- =============================================================================
-- Base: extensiones, tipos y funciones de ayuda que usan las demás migraciones.
-- =============================================================================

-- btree_gist permite combinar "=" (misma profesional / mismo box) con "&&"
-- (rangos de tiempo que se pisan) en una restricción de exclusión.
create extension if not exists btree_gist with schema extensions;

-- Roles de las personas que usan la app (ver CLAUDE.md §3).
create type public.rol_usuario as enum ('admin', 'profesional');

-- Estados de un turno. "no_asistio" sin tilde: en pantalla se muestra "No asistió".
create type public.estado_turno as enum (
  'reservado',
  'confirmado',
  'realizado',
  'cancelado',
  'no_asistio'
);

-- De dónde vino el turno: cargado en la agenda interna o, en el futuro, desde la web pública.
create type public.origen_turno as enum ('interno', 'web');

-- Rango de horas dentro de un día (ej. 09:00–13:00). Sirve para impedir que dos
-- rangos del mismo día se pisen. Los rangos son [inicio, fin): 09:00–13:00 y
-- 13:00–17:00 NO se pisan.
create type public.rango_horario as range (subtype = time);

-- -----------------------------------------------------------------------------
-- ¿La hora cae en un paso de 15 minutos? (09:00, 09:15, 09:30, 09:45…)
-- -----------------------------------------------------------------------------
create function public.es_paso_15_min(hora time)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extract(minute from hora)::int % 15 = 0
     and extract(second from hora) = 0;
$$;

-- -----------------------------------------------------------------------------
-- Mantiene la columna updated_at al día en cada modificación.
-- -----------------------------------------------------------------------------
create function public.actualizar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

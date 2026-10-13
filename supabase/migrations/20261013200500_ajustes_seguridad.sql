-- =============================================================================
-- Ajustes sugeridos por el revisor de seguridad de Supabase (db advisors).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Las funciones de permisos se mudan a un esquema "privado" que la API no
--    expone: las reglas RLS las siguen usando, pero ya no se pueden llamar
--    desde /rest/v1/rpc/…  (Las políticas apuntan a la función, no al nombre,
--    así que siguen funcionando sin cambios.)
-- -----------------------------------------------------------------------------
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

alter function public.es_usuario_activo() set schema privado;
alter function public.es_admin() set schema privado;
alter function public.mi_profesional_id() set schema privado;

-- Este trigger llamaba a es_admin() por su nombre completo: se actualiza.
create or replace function public.validar_cambio_activo_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.activo is distinct from old.activo
     and (select auth.uid()) is not null
     and not privado.es_admin() then
    raise exception 'Solo un administrador puede desactivar o reactivar clientes.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Se reemplaza el tipo propio rango_horario por el tsrange que trae Postgres.
--    Las funciones que Postgres genera para un tipo de rango propio quedan sin
--    search_path fijo y no se pueden ajustar en Supabase. Con tsrange, anclando
--    las horas a una fecha fija (2000-01-01), la regla es exactamente la misma:
--    dos rangos del mismo día no se pueden pisar.
-- -----------------------------------------------------------------------------
alter table public.horario_spa
  drop constraint horario_spa_sin_superposicion,
  add constraint horario_spa_sin_superposicion
    exclude using gist (
      dia_semana with =,
      tsrange(date '2000-01-01' + apertura, date '2000-01-01' + cierre) with &&
    );

alter table public.horarios_profesional
  drop constraint horarios_profesional_sin_superposicion,
  add constraint horarios_profesional_sin_superposicion
    exclude using gist (
      profesional_id with =,
      dia_semana with =,
      tsrange(date '2000-01-01' + inicio, date '2000-01-01' + fin) with &&
    );

drop type public.rango_horario;

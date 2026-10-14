-- =============================================================================
-- Atención doble: algunos servicios (ej. masaje reductor) permiten que una
-- profesional atienda a 2 clientes al mismo tiempo, en boxes distintos.
--
-- Nueva regla de superposición por profesional:
--   * Si el turno es de un servicio normal: no puede pisarse con ningún otro.
--   * Si es de un servicio con atención doble: puede pisarse con otro turno
--     que TAMBIÉN sea de atención doble, con un máximo de 2 a la vez.
--   * Los boxes siguen sin poder tener dos turnos a la vez (restricción
--     turnos_sin_superposicion_box, sin cambios): los 2 clientes van en boxes distintos.
-- =============================================================================

alter table public.servicios
  add column permite_dos_clientes boolean not null default false;

comment on column public.servicios.permite_dos_clientes is
  'Si una profesional puede atender a 2 clientes a la vez con este servicio (en boxes distintos).';

-- Una restricción de exclusión no sabe "contar hasta 2": se reemplaza por un trigger.
alter table public.turnos drop constraint turnos_sin_superposicion_profesional;

-- Índice para buscar rápido los turnos de una profesional en un rango de tiempo.
create index turnos_profesional_rango_idx
  on public.turnos using gist (profesional_id, tstzrange(inicio, fin))
  where (estado <> 'cancelado');

create function public.validar_superposicion_profesional()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  rango tstzrange := tstzrange(new.inicio, new.fin);
  nuevo_permite_dos boolean;
  superpuestos integer;
  superpuestos_normales integer;
begin
  -- Solo se revisa si cambia algo que afecte la superposición
  -- (así se puede seguir cambiando el estado de turnos ya cargados).
  if tg_op = 'UPDATE'
     and new.inicio = old.inicio
     and new.fin = old.fin
     and new.profesional_id = old.profesional_id
     and new.servicio_id = old.servicio_id
     and not (old.estado = 'cancelado' and new.estado <> 'cancelado') then
    return new;
  end if;

  if new.estado = 'cancelado' then
    return new;
  end if;

  -- Evita que dos personas guarden a la vez turnos de la misma profesional
  -- y ambas pasen el control: la segunda espera a que termine la primera.
  perform pg_advisory_xact_lock(hashtextextended('turnos_profesional:' || new.profesional_id::text, 0));

  select s.permite_dos_clientes into nuevo_permite_dos
  from public.servicios s where s.id = new.servicio_id;

  select count(*), count(*) filter (where not s.permite_dos_clientes)
    into superpuestos, superpuestos_normales
  from public.turnos t
  join public.servicios s on s.id = t.servicio_id
  where t.profesional_id = new.profesional_id
    and t.estado <> 'cancelado'
    and t.id <> new.id
    and tstzrange(t.inicio, t.fin) && rango;

  if superpuestos = 0 then
    return new;
  end if;

  if not nuevo_permite_dos or superpuestos_normales > 0 then
    raise exception 'La profesional ya tiene un turno en ese horario.'
      using errcode = '23P01', constraint = 'turnos_sin_superposicion_profesional';
  end if;

  -- Máximo 2 a la vez: si dos de los turnos superpuestos también se pisan
  -- entre sí, junto con el nuevo serían 3 clientes al mismo tiempo.
  if exists (
    select 1
    from public.turnos a
    join public.turnos b
      on a.id < b.id
     and tstzrange(a.inicio, a.fin) && tstzrange(b.inicio, b.fin)
    where a.profesional_id = new.profesional_id
      and b.profesional_id = new.profesional_id
      and a.estado <> 'cancelado'
      and b.estado <> 'cancelado'
      and a.id <> new.id
      and b.id <> new.id
      and tstzrange(a.inicio, a.fin) && rango
      and tstzrange(b.inicio, b.fin) && rango
  ) then
    raise exception 'La profesional ya atiende a 2 clientes en ese horario.'
      using errcode = '23P01', constraint = 'turnos_maximo_dos_clientes';
  end if;

  return new;
end;
$$;

create trigger turnos_validar_superposicion_profesional
  before insert or update on public.turnos
  for each row execute function public.validar_superposicion_profesional();

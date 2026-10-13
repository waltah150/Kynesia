-- =============================================================================
-- Turnos: el corazón de la agenda.
-- Reglas que se garantizan acá (no solo en pantalla, CLAUDE.md §4.1):
--   1. Una profesional no puede tener dos turnos superpuestos.
--   2. Un box no puede tener dos turnos superpuestos.
--   3. El turno debe estar dentro del horario del spa (en hora de Asunción).
-- Los turnos cancelados no ocupan lugar.
-- =============================================================================

create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  servicio_id uuid not null references public.servicios (id) on delete restrict,
  profesional_id uuid not null references public.profesionales (id) on delete restrict,
  box_id uuid references public.boxes (id) on delete restrict,
  inicio timestamptz not null,
  fin timestamptz not null,
  -- Copia del precio al momento de agendar: si el precio del servicio cambia, el turno conserva el suyo.
  precio_cobrado integer not null,
  estado public.estado_turno not null default 'reservado',
  notas text,
  creado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  -- Para la futura sincronización con Google Calendar (vacío por ahora).
  google_event_id text,
  origen public.origen_turno not null default 'interno',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint turnos_rango_valido check (inicio < fin),
  constraint turnos_precio_valido check (precio_cobrado >= 0),

  -- [inicio, fin): un turno que termina 10:30 y otro que empieza 10:30 NO se pisan.
  constraint turnos_sin_superposicion_profesional
    exclude using gist (profesional_id with =, tstzrange(inicio, fin) with &&)
    where (estado <> 'cancelado'),

  constraint turnos_sin_superposicion_box
    exclude using gist (box_id with =, tstzrange(inicio, fin) with &&)
    where (box_id is not null and estado <> 'cancelado')
);

comment on table public.turnos is 'Turnos agendados. Fechas en UTC (timestamptz); la app las muestra en America/Asuncion.';

create index turnos_inicio_idx on public.turnos (inicio);
create index turnos_cliente_idx on public.turnos (cliente_id, inicio desc);
create index turnos_servicio_idx on public.turnos (servicio_id);
create index turnos_box_idx on public.turnos (box_id);

create trigger turnos_updated_at before update on public.turnos
  for each row execute function public.actualizar_updated_at();

-- -----------------------------------------------------------------------------
-- Valida que el turno caiga dentro del horario del spa, en pasos de 15 minutos.
-- Solo se revisa al crear el turno, al cambiarle el horario o al reactivar uno
-- cancelado. Así, si el spa cambia su horario, los turnos ya cargados se pueden
-- seguir marcando como realizados o cancelados.
-- -----------------------------------------------------------------------------
create function public.validar_turno_en_horario_spa()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  inicio_local timestamp := new.inicio at time zone 'America/Asuncion';
  fin_local timestamp := new.fin at time zone 'America/Asuncion';
begin
  if tg_op = 'UPDATE'
     and new.inicio = old.inicio
     and new.fin = old.fin
     and not (old.estado = 'cancelado' and new.estado <> 'cancelado') then
    return new;
  end if;

  if new.estado = 'cancelado' then
    return new;
  end if;

  if not (public.es_paso_15_min(inicio_local::time) and public.es_paso_15_min(fin_local::time)) then
    raise exception 'El turno debe empezar y terminar en pasos de 15 minutos.'
      using errcode = '23514', constraint = 'turnos_pasos_15_min';
  end if;

  if not exists (
    select 1
    from public.horario_spa h
    where h.dia_semana = extract(isodow from inicio_local)
      and inicio_local::date = fin_local::date
      and inicio_local::time >= h.apertura
      and fin_local::time <= h.cierre
  ) then
    raise exception 'El turno está fuera del horario de apertura del spa.'
      using errcode = '23514', constraint = 'turnos_dentro_horario_spa';
  end if;

  return new;
end;
$$;

create trigger turnos_validar_horario_spa
  before insert or update on public.turnos
  for each row execute function public.validar_turno_en_horario_spa();

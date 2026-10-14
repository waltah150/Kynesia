-- =============================================================================
-- Fase 4: clientes y profesionales.
--   1. Búsqueda de clientes sin importar tildes ni mayúsculas ("gomez" → "Gómez").
--   2. Guardar horarios completos (spa y profesionales) de una sola vez.
--   3. Detectar turnos que quedan fuera del horario de su profesional ("!").
--   4. Guardar la ficha de una profesional (datos, servicios y cuenta) de una vez.
--
-- Las funciones son "security invoker" (las de Postgres por defecto): corren con
-- los permisos de quien las llama, así que las reglas RLS siguen aplicando.
-- =============================================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Búsqueda de clientes
-- -----------------------------------------------------------------------------

-- Texto en minúsculas y sin tildes. La app normaliza lo que se escribe en el
-- buscador de la misma forma, y compara contra la columna "busqueda".
create function privado.sin_acentos(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texto));
$$;

revoke execute on function privado.sin_acentos(text) from public, anon;
grant execute on function privado.sin_acentos(text) to authenticated;

alter table public.clientes
  add column busqueda text
  generated always as (privado.sin_acentos(nombre || ' ' || apellido || ' ' || telefono)) stored;

comment on column public.clientes.busqueda is
  'Nombre, apellido y teléfono en minúsculas y sin tildes, para el buscador. Se calcula sola.';

-- Índice de trigramas: hace rápida la búsqueda por partes del texto (ilike '%gom%').
create index clientes_busqueda_idx on public.clientes using gin (busqueda extensions.gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 2. Guardar horarios completos
-- p_rangos: lista JSON de { "dia_semana": 1-7, "inicio": "09:00", "fin": "13:00" }.
-- Se reemplaza todo el horario en una sola transacción: si algún rango es
-- inválido (se pisa, no es de 15 min, etc.) no se guarda nada.
-- -----------------------------------------------------------------------------

-- Turnos futuros y activos de una profesional que caen fuera de su horario.
create function public.fuera_de_horario(turno public.turnos)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not exists (
    select 1
    from public.horarios_profesional h
    where h.profesional_id = turno.profesional_id
      and h.dia_semana = extract(isodow from turno.inicio at time zone 'America/Asuncion')
      and (turno.inicio at time zone 'America/Asuncion')::date
        = (turno.fin at time zone 'America/Asuncion')::date
      and (turno.inicio at time zone 'America/Asuncion')::time >= h.inicio
      and (turno.fin at time zone 'America/Asuncion')::time <= h.fin
  );
$$;

comment on function public.fuera_de_horario(public.turnos) is
  'true si el turno no cae dentro del horario semanal de su profesional (alerta "!" de la agenda).';

create function public.contar_turnos_fuera_de_horario(p_profesional_id uuid)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer
  from public.turnos t
  where t.profesional_id = p_profesional_id
    and t.inicio >= now()
    and t.estado in ('reservado', 'confirmado')
    and public.fuera_de_horario(t);
$$;

create function public.guardar_horario_profesional(p_profesional_id uuid, p_rangos jsonb)
returns integer
language plpgsql
set search_path = ''
as $$
begin
  if not (privado.es_admin() or p_profesional_id = privado.mi_profesional_id()) then
    raise exception 'No tenés permiso para editar el horario de esta profesional.'
      using errcode = '42501';
  end if;

  delete from public.horarios_profesional where profesional_id = p_profesional_id;

  insert into public.horarios_profesional (profesional_id, dia_semana, inicio, fin)
  select p_profesional_id, r.dia_semana, r.inicio, r.fin
  from jsonb_to_recordset(coalesce(p_rangos, '[]'::jsonb)) as r(dia_semana smallint, inicio time, fin time);

  -- Devuelve cuántos turnos futuros quedaron fuera del nuevo horario.
  return public.contar_turnos_fuera_de_horario(p_profesional_id);
end;
$$;

create function public.guardar_horario_spa(p_rangos jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not privado.es_admin() then
    raise exception 'Solo un administrador puede editar el horario del spa.'
      using errcode = '42501';
  end if;

  delete from public.horario_spa where true;

  insert into public.horario_spa (dia_semana, apertura, cierre)
  select r.dia_semana, r.apertura, r.cierre
  from jsonb_to_recordset(coalesce(p_rangos, '[]'::jsonb)) as r(dia_semana smallint, apertura time, cierre time);
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Guardar la ficha de una profesional: datos, servicios que realiza y
--    cuenta de acceso vinculada (un usuario de Supabase Auth). Todo o nada.
-- -----------------------------------------------------------------------------
create function public.guardar_profesional(
  p_id uuid,
  p_nombre text,
  p_apellido text,
  p_color text,
  p_activa boolean,
  p_servicios uuid[],
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

  -- Servicios que realiza: se quitan los desmarcados y se agregan los nuevos.
  delete from public.profesional_servicios
  where profesional_id = v_id
    and servicio_id <> all (coalesce(p_servicios, '{}'));

  insert into public.profesional_servicios (profesional_id, servicio_id)
  select v_id, s from unnest(coalesce(p_servicios, '{}')) as s
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

-- Solo usuarios logueados pueden llamar a estas funciones.
revoke execute on function public.fuera_de_horario(public.turnos) from public, anon;
revoke execute on function public.contar_turnos_fuera_de_horario(uuid) from public, anon;
revoke execute on function public.guardar_horario_profesional(uuid, jsonb) from public, anon;
revoke execute on function public.guardar_horario_spa(jsonb) from public, anon;
revoke execute on function public.guardar_profesional(uuid, text, text, text, boolean, uuid[], uuid) from public, anon;
grant execute on function public.fuera_de_horario(public.turnos) to authenticated;
grant execute on function public.contar_turnos_fuera_de_horario(uuid) to authenticated;
grant execute on function public.guardar_horario_profesional(uuid, jsonb) to authenticated;
grant execute on function public.guardar_horario_spa(jsonb) to authenticated;
grant execute on function public.guardar_profesional(uuid, text, text, text, boolean, uuid[], uuid) to authenticated;

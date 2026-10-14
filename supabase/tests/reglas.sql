-- =============================================================================
-- Pruebas de las reglas de la base de datos (restricciones + RLS).
--
-- Todo corre dentro de una transacción que termina en ROLLBACK: los datos de
-- prueba (inventados) se crean, se usan y se descartan. No queda nada guardado.
--
-- Uso:  npx supabase db query --linked -f supabase/tests/reglas.sql
-- Resultado: una tabla con cada prueba y si pasó (paso = true).
-- Las pruebas que cuentan filas filtran por los ids de prueba, para no depender
-- de los datos reales que ya existan en la base.
-- =============================================================================

begin;

create temp table resultados (
  orden serial,
  prueba text,
  esperado text,
  obtenido text,
  paso boolean
);

-- -----------------------------------------------------------------------------
-- probar(prueba, como, sql, esperado)
--   como:     'postgres' (dueño, sin RLS), 'anon' o el uuid de un usuario logueado.
--   esperado: 'ok' (sin error), 'ok:N' (sin error y N filas afectadas/leídas)
--             o el código SQLSTATE del error esperado (ej. '23P01', '42501').
-- Cada prueba corre en su propia subtransacción: si falla, no afecta a las demás.
-- -----------------------------------------------------------------------------
create function pg_temp.probar(p_prueba text, p_como text, p_sql text, p_esperado text)
returns void
language plpgsql
as $$
declare
  filas bigint;
  obtenido text;
begin
  begin
    if p_como = 'anon' then
      perform set_config('request.jwt.claims', '{"role":"anon"}', true);
      execute 'set local role anon';
    elsif p_como <> 'postgres' then
      perform set_config('request.jwt.claims',
        json_build_object('sub', p_como, 'role', 'authenticated')::text, true);
      execute 'set local role authenticated';
    end if;

    execute p_sql;
    get diagnostics filas = row_count;
    execute 'reset role';
    obtenido := 'ok:' || filas;
  exception when others then
    obtenido := sqlstate || ' ' || sqlerrm;
  end;

  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);

  insert into resultados (prueba, esperado, obtenido, paso)
  values (
    p_prueba,
    p_esperado,
    obtenido,
    case
      when p_esperado = 'ok' then obtenido like 'ok:%'
      when p_esperado like 'ok:%' then obtenido = p_esperado
      else obtenido like p_esperado || ' %'
    end
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Datos de prueba inventados (se descartan con el ROLLBACK final).
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-a000-000000000001', 'admin.prueba@ejemplo.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000002', 'profesional.prueba@ejemplo.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-a000-000000000003', 'inactiva.prueba@ejemplo.test', 'authenticated', 'authenticated');

insert into public.profesionales (id, nombre, apellido, color) values
  ('00000000-0000-4000-b000-000000000001', 'Ana', 'Prueba', '#A3B18A'),
  ('00000000-0000-4000-b000-000000000002', 'Bea', 'Prueba', '#D4A373');

update public.perfiles set rol = 'admin' where id = '00000000-0000-4000-a000-000000000001';
update public.perfiles set profesional_id = '00000000-0000-4000-b000-000000000001'
  where id = '00000000-0000-4000-a000-000000000002';
update public.perfiles set activo = false where id = '00000000-0000-4000-a000-000000000003';

-- El spa abre los lunes de 09:00 a 19:00. El 7 de enero de 2030 es lunes.
-- Se parte de un horario vacío para no chocar con el horario real cargado
-- (el borrado también se deshace con el ROLLBACK final).
delete from public.horario_spa where true;
insert into public.horario_spa (dia_semana, apertura, cierre) values (1, '09:00', '19:00');

insert into public.grupos (id, nombre) values ('00000000-0000-4000-c000-000000000001', 'Grupo de prueba');
insert into public.servicios (id, grupo_id, nombre, duracion_min, precio) values
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-c000-000000000001', 'Servicio de prueba', 60, 150000);
insert into public.servicios (id, grupo_id, nombre, duracion_min, precio, permite_dos_clientes) values
  ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-c000-000000000001', 'Masaje reductor de prueba', 60, 200000, true);
insert into public.paquetes (id, servicio_id, sesiones, precio) values
  ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-c000-000000000002', 6, 700000);
insert into public.clientes (id, nombre, apellido, telefono, creado_por) values
  ('00000000-0000-4000-d000-000000000001', 'Cliente', 'Prueba', '+595981000001', '00000000-0000-4000-a000-000000000001');

-- Atajo: arma un INSERT de turno en hora de Asunción del lunes 2030-01-07.
create function pg_temp.turno(p_profesional text, p_box int, p_desde text, p_hasta text, p_dia text default '2030-01-07',
                               p_servicio text default '00000000-0000-4000-c000-000000000002')
returns text
language sql
as $$
  select format(
    $f$insert into public.turnos (cliente_id, servicio_id, profesional_id, box_id, inicio, fin, precio_cobrado, creado_por)
       values ('00000000-0000-4000-d000-000000000001', %L, %L,
               (select id from public.boxes where numero = %s),
               timezone('America/Asuncion', %L::timestamp), timezone('America/Asuncion', %L::timestamp),
               150000, coalesce(auth.uid(), '00000000-0000-4000-a000-000000000001'))$f$,
    p_servicio, p_profesional, coalesce(p_box::text, 'null'), p_dia || ' ' || p_desde, p_dia || ' ' || p_hasta
  );
$$;

-- Ana = …b001, Bea = …b002
-- -----------------------------------------------------------------------------
-- 1) Superposición de turnos
-- -----------------------------------------------------------------------------
select pg_temp.probar('Turno válido (Ana, box 1, 10:00–11:00)', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 1, '10:00', '11:00'), 'ok:1');
select pg_temp.probar('Ana no puede tener dos turnos que se pisan', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', null, '10:30', '11:30'), '23P01');
select pg_temp.probar('El box 1 no puede tener dos turnos que se pisan', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', 1, '10:30', '11:30'), '23P01');
select pg_temp.probar('Turno pegado al anterior (11:00–12:00) sí se puede', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 1, '11:00', '12:00'), 'ok:1');
select pg_temp.probar('Otra profesional en otro box a la misma hora sí se puede', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', 2, '10:00', '11:00'), 'ok:1');
select pg_temp.probar('Cancelar el turno de las 10:00', 'postgres',
  $$update public.turnos set estado = 'cancelado'
    where profesional_id = '00000000-0000-4000-b000-000000000001'
      and inicio = timezone('America/Asuncion', '2030-01-07 10:00'::timestamp)$$, 'ok:1');
select pg_temp.probar('Un turno cancelado libera el horario', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 1, '10:00', '11:00'), 'ok:1');

-- -----------------------------------------------------------------------------
-- 2) Horario del spa y pasos de 15 minutos
-- -----------------------------------------------------------------------------
select pg_temp.probar('Turno antes de la apertura (08:00) se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', null, '08:00', '09:00'), '23514');
select pg_temp.probar('Turno que termina después del cierre se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', null, '18:30', '19:30'), '23514');
select pg_temp.probar('Turno en un día que el spa no abre (martes) se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', null, '10:00', '11:00', '2030-01-08'), '23514');
select pg_temp.probar('Turno a las 13:10 (fuera de los pasos de 15 min) se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', null, '13:10', '14:10'), '23514');
select pg_temp.probar('Horario del spa que se pisa con otro del mismo día se rechaza', 'postgres',
  $$insert into public.horario_spa (dia_semana, apertura, cierre) values (1, '18:00', '20:00')$$, '23P01');
select pg_temp.probar('Horario del spa a las 09:10 se rechaza', 'postgres',
  $$insert into public.horario_spa (dia_semana, apertura, cierre) values (2, '09:10', '12:00')$$, '23514');
select pg_temp.probar('Horario de profesional que se pisa se rechaza', 'postgres',
  $$insert into public.horarios_profesional (profesional_id, dia_semana, inicio, fin) values
    ('00000000-0000-4000-b000-000000000001', 1, '09:00', '13:00'),
    ('00000000-0000-4000-b000-000000000001', 1, '12:00', '15:00')$$, '23P01');

-- -----------------------------------------------------------------------------
-- 3) Validaciones de datos
-- -----------------------------------------------------------------------------
select pg_temp.probar('Servicio de 20 minutos (no es múltiplo de 15) se rechaza', 'postgres',
  $$insert into public.servicios (grupo_id, nombre, duracion_min, precio)
    values ('00000000-0000-4000-c000-000000000001', 'Otro', 20, 1000)$$, '23514');
select pg_temp.probar('Teléfono sin formato internacional se rechaza', 'postgres',
  $$insert into public.clientes (nombre, apellido, telefono) values ('X', 'Y', '0981 123 456')$$, '23514');
select pg_temp.probar('Teléfono repetido se rechaza', 'postgres',
  $$insert into public.clientes (nombre, apellido, telefono) values ('X', 'Y', '+595981000001')$$, '23505');
select pg_temp.probar('Grupo con nombre repetido (otras mayúsculas) se rechaza', 'postgres',
  $$insert into public.grupos (nombre) values ('GRUPO DE PRUEBA')$$, '23505');
select pg_temp.probar('Promoción de servicio Y paquete a la vez se rechaza', 'postgres',
  $$insert into public.promociones (servicio_id, paquete_id, precio, inicio, fin)
      values ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-c000-000000000003', 100000, '2030-01-01', '2030-01-31')$$, '23514');
select pg_temp.probar('Color de profesional inválido se rechaza', 'postgres',
  $$insert into public.profesionales (nombre, apellido, color) values ('X', 'Y', 'verde')$$, '23514');

-- -----------------------------------------------------------------------------
-- 4) Seguridad: público anónimo
-- -----------------------------------------------------------------------------
select pg_temp.probar('Anónimo no puede leer turnos', 'anon',
  'select * from public.turnos', '42501');
select pg_temp.probar('Anónimo no puede leer clientes', 'anon',
  'select * from public.clientes', '42501');
select pg_temp.probar('Anónimo no puede crear clientes', 'anon',
  $$insert into public.clientes (nombre, apellido, telefono) values ('X', 'Y', '+595981000099')$$, '42501');

-- -----------------------------------------------------------------------------
-- 5) Seguridad: profesional (Ana)
-- -----------------------------------------------------------------------------
select pg_temp.probar('Profesional ve los servicios', '00000000-0000-4000-a000-000000000002',
  $$select * from public.servicios where grupo_id = '00000000-0000-4000-c000-000000000001'$$, 'ok:2');
select pg_temp.probar('Profesional ve todos los turnos (también los de otras)', '00000000-0000-4000-a000-000000000002',
  $$select * from public.turnos where cliente_id = '00000000-0000-4000-d000-000000000001'$$, 'ok:4');
select pg_temp.probar('Profesional NO puede crear servicios', '00000000-0000-4000-a000-000000000002',
  $$insert into public.servicios (grupo_id, nombre, duracion_min, precio)
    values ('00000000-0000-4000-c000-000000000001', 'Nuevo', 30, 1000)$$, '42501');
select pg_temp.probar('Profesional NO puede cambiar precios (0 filas)', '00000000-0000-4000-a000-000000000002',
  'update public.servicios set precio = 1', 'ok:0');
select pg_temp.probar('Profesional crea un cliente', '00000000-0000-4000-a000-000000000002',
  $$insert into public.clientes (nombre, apellido, telefono) values ('Nueva', 'Clienta', '+595981000002')$$, 'ok:1');
select pg_temp.probar('Profesional edita un cliente', '00000000-0000-4000-a000-000000000002',
  $$update public.clientes set notas = 'Prefiere la tarde' where telefono = '+595981000001'$$, 'ok:1');
select pg_temp.probar('Profesional NO puede desactivar clientes', '00000000-0000-4000-a000-000000000002',
  $$update public.clientes set activo = false where telefono = '+595981000001'$$, '42501');
select pg_temp.probar('Profesional crea un turno para otra profesional (Bea)', '00000000-0000-4000-a000-000000000002',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', null, '14:00', '15:00'), 'ok:1');
select pg_temp.probar('Profesional NO puede crear turnos a nombre de otro usuario', '00000000-0000-4000-a000-000000000002',
  replace(pg_temp.turno('00000000-0000-4000-b000-000000000002', null, '15:00', '16:00'),
          'coalesce(auth.uid(), ''00000000-0000-4000-a000-000000000001'')', '''00000000-0000-4000-a000-000000000001'''), '42501');
select pg_temp.probar('Profesional cambia el estado de un turno de otra', '00000000-0000-4000-a000-000000000002',
  $$update public.turnos set estado = 'confirmado' where profesional_id = '00000000-0000-4000-b000-000000000002' and estado = 'reservado'$$, 'ok');
select pg_temp.probar('Profesional NO puede borrar turnos (0 filas)', '00000000-0000-4000-a000-000000000002',
  'delete from public.turnos', 'ok:0');
select pg_temp.probar('Profesional carga SU horario', '00000000-0000-4000-a000-000000000002',
  $$insert into public.horarios_profesional (profesional_id, dia_semana, inicio, fin)
    values ('00000000-0000-4000-b000-000000000001', 2, '09:00', '13:00')$$, 'ok:1');
select pg_temp.probar('Profesional NO puede cargar el horario de otra', '00000000-0000-4000-a000-000000000002',
  $$insert into public.horarios_profesional (profesional_id, dia_semana, inicio, fin)
    values ('00000000-0000-4000-b000-000000000002', 2, '09:00', '13:00')$$, '42501');
select pg_temp.probar('Profesional NO puede cambiar su propio rol (0 filas)', '00000000-0000-4000-a000-000000000002',
  $$update public.perfiles set rol = 'admin' where id = '00000000-0000-4000-a000-000000000002'$$, 'ok:0');
select pg_temp.probar('Profesional solo ve su propio perfil', '00000000-0000-4000-a000-000000000002',
  'select * from public.perfiles', 'ok:1');
select pg_temp.probar('Editar un turno no cambia quién lo creó', '00000000-0000-4000-a000-000000000002',
  $$update public.turnos set creado_por = '00000000-0000-4000-a000-000000000002'
    where creado_por = '00000000-0000-4000-a000-000000000001'$$, 'ok:4');
select pg_temp.probar('…y los 4 turnos siguen figurando con su creador original', 'postgres',
  $$select 1 from public.turnos where creado_por = '00000000-0000-4000-a000-000000000001'$$, 'ok:4');

-- -----------------------------------------------------------------------------
-- 6) Seguridad: admin y usuario desactivado
-- -----------------------------------------------------------------------------
select pg_temp.probar('Admin crea un servicio', '00000000-0000-4000-a000-000000000001',
  $$insert into public.servicios (grupo_id, nombre, duracion_min, precio)
    values ('00000000-0000-4000-c000-000000000001', 'Nuevo', 30, 1000)$$, 'ok:1');
select pg_temp.probar('Admin desactiva un cliente', '00000000-0000-4000-a000-000000000001',
  $$update public.clientes set activo = false where telefono = '+595981000002'$$, 'ok:1');
select pg_temp.probar('Admin ve todos los perfiles de prueba', '00000000-0000-4000-a000-000000000001',
  $$select * from public.perfiles where id::text like '00000000-0000-4000-a000-%'$$, 'ok:3');
select pg_temp.probar('Usuario desactivado no ve turnos', '00000000-0000-4000-a000-000000000003',
  'select * from public.turnos', 'ok:0');
select pg_temp.probar('Usuario desactivado no puede crear clientes', '00000000-0000-4000-a000-000000000003',
  $$insert into public.clientes (nombre, apellido, telefono) values ('X', 'Y', '+595981000098')$$, '42501');

-- -----------------------------------------------------------------------------
-- 7) Atención doble (servicios que permiten 2 clientes a la vez, en boxes distintos)
--    Ana tiene libre la tarde del lunes. "Masaje reductor de prueba" = …c004.
-- -----------------------------------------------------------------------------
select pg_temp.probar('Atención doble: 1er cliente (15:00–16:00, box 3)', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 3, '15:00', '16:00', p_servicio => '00000000-0000-4000-c000-000000000004'), 'ok:1');
select pg_temp.probar('Atención doble: 2º cliente a la vez (15:30–16:30, box 4)', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 4, '15:30', '16:30', p_servicio => '00000000-0000-4000-c000-000000000004'), 'ok:1');
select pg_temp.probar('Atención doble: un 3er cliente a la vez se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 1, '15:45', '16:15', p_servicio => '00000000-0000-4000-c000-000000000004'), '23P01');
select pg_temp.probar('Servicio normal encima de una atención doble se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 1, '16:00', '17:00'), '23P01');
select pg_temp.probar('Atención doble encima de un servicio normal se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 3, '11:30', '12:30', p_servicio => '00000000-0000-4000-c000-000000000004'), '23P01');
select pg_temp.probar('Atención doble en el mismo box que otro turno se rechaza', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000002', 3, '15:00', '16:00', p_servicio => '00000000-0000-4000-c000-000000000004'), '23P01');
select pg_temp.probar('Atención doble: cuando termina uno, entra otro (16:30–17:30)', 'postgres',
  pg_temp.turno('00000000-0000-4000-b000-000000000001', 3, '16:30', '17:30', p_servicio => '00000000-0000-4000-c000-000000000004'), 'ok:1');
select pg_temp.probar('Cambiar el estado de un turno doble no vuelve a validar', 'postgres',
  $$update public.turnos set estado = 'confirmado'
    where servicio_id = '00000000-0000-4000-c000-000000000004'
      and inicio = timezone('America/Asuncion', '2030-01-07 15:00'::timestamp)$$, 'ok:1');

-- -----------------------------------------------------------------------------
-- 8) Clientes y profesionales (Fase 4)
-- -----------------------------------------------------------------------------
select pg_temp.probar('Búsqueda de clientes sin tildes ni mayúsculas', 'postgres',
  $$insert into public.clientes (nombre, apellido, telefono) values ('José', 'GÓMEZ Núñez', '+595981000003')$$, 'ok:1');
select pg_temp.probar('…"jose gomez nunez" encuentra a "José GÓMEZ Núñez"', '00000000-0000-4000-a000-000000000002',
  $$select 1 from public.clientes where busqueda like '%jose gomez nunez%'$$, 'ok:1');
select pg_temp.probar('…y también por parte del teléfono', '00000000-0000-4000-a000-000000000002',
  $$select 1 from public.clientes where busqueda like '%981000003%'$$, 'ok:1');

select pg_temp.probar('Cliente sin teléfono se puede crear', '00000000-0000-4000-a000-000000000002',
  $$insert into public.clientes (nombre, apellido) values ('Sin', 'Teléfono Uno')$$, 'ok:1');
select pg_temp.probar('Varios clientes sin teléfono no chocan entre sí', '00000000-0000-4000-a000-000000000002',
  $$insert into public.clientes (nombre, apellido) values ('Sin', 'Teléfono Dos')$$, 'ok:1');
select pg_temp.probar('…y se encuentran con el buscador', '00000000-0000-4000-a000-000000000002',
  $$select 1 from public.clientes where busqueda like '%sin telefono%'$$, 'ok:2');

-- Horario de Ana: lunes 09:00–12:00. Sus turnos del lunes a la tarde (atención doble:
-- 15:00, 15:30 y 16:30) quedan fuera; los de la mañana (10:00 y 11:00) quedan dentro.
select pg_temp.probar('Profesional guarda su horario y ve cuántos turnos quedan fuera (3)', '00000000-0000-4000-a000-000000000002',
  $$select 1 where public.guardar_horario_profesional('00000000-0000-4000-b000-000000000001',
    '[{"dia_semana":1,"inicio":"09:00","fin":"12:00"},{"dia_semana":3,"inicio":"14:00","fin":"18:00"}]') = 3$$, 'ok:1');
select pg_temp.probar('…el horario guardado tiene 2 rangos', 'postgres',
  $$select 1 from public.horarios_profesional where profesional_id = '00000000-0000-4000-b000-000000000001'$$, 'ok:2');
select pg_temp.probar('Horario con rangos que se pisan se rechaza…', '00000000-0000-4000-a000-000000000002',
  $$select public.guardar_horario_profesional('00000000-0000-4000-b000-000000000001',
    '[{"dia_semana":2,"inicio":"09:00","fin":"13:00"},{"dia_semana":2,"inicio":"12:00","fin":"15:00"}]')$$, '23P01');
select pg_temp.probar('…y no deja el horario a medias (siguen los 2 rangos anteriores)', 'postgres',
  $$select 1 from public.horarios_profesional where profesional_id = '00000000-0000-4000-b000-000000000001'$$, 'ok:2');
select pg_temp.probar('Profesional NO puede guardar el horario de otra', '00000000-0000-4000-a000-000000000002',
  $$select public.guardar_horario_profesional('00000000-0000-4000-b000-000000000002', '[]')$$, '42501');
select pg_temp.probar('Profesional NO puede cambiar el horario del spa', '00000000-0000-4000-a000-000000000002',
  $$select public.guardar_horario_spa('[]')$$, '42501');
select pg_temp.probar('Admin cambia el horario del spa', '00000000-0000-4000-a000-000000000001',
  $$select public.guardar_horario_spa('[{"dia_semana":1,"apertura":"09:00","cierre":"19:00"},{"dia_semana":6,"apertura":"09:00","cierre":"13:00"}]')$$, 'ok');
select pg_temp.probar('…y quedan 2 rangos en el horario del spa', 'postgres',
  'select 1 from public.horario_spa', 'ok:2');

select pg_temp.probar('Profesional NO puede editar fichas de profesionales', '00000000-0000-4000-a000-000000000002',
  $$select public.guardar_profesional(null, 'X', 'Y', '#A3B18A', true, '{}', null)$$, '42501');
select pg_temp.probar('Admin crea una profesional con un grupo de servicios y le vincula una cuenta', '00000000-0000-4000-a000-000000000001',
  $$select public.guardar_profesional(null, 'Carla', 'Prueba', '#9DB4C0', true,
    array['00000000-0000-4000-c000-000000000001']::uuid[],
    '00000000-0000-4000-a000-000000000003')$$, 'ok');
select pg_temp.probar('…queda con 1 grupo', 'postgres',
  $$select 1 from public.profesional_grupos pg join public.profesionales p on p.id = pg.profesional_id
    where p.nombre = 'Carla'$$, 'ok:1');
select pg_temp.probar('Profesional NO puede asignarse grupos', '00000000-0000-4000-a000-000000000002',
  $$insert into public.profesional_grupos (profesional_id, grupo_id)
    values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-c000-000000000001')$$, '42501');
select pg_temp.probar('…y la cuenta queda vinculada a ella', 'postgres',
  $$select 1 from public.perfiles pe join public.profesionales p on p.id = pe.profesional_id
    where pe.id = '00000000-0000-4000-a000-000000000003' and p.nombre = 'Carla'$$, 'ok:1');
select pg_temp.probar('Pasar la cuenta de Ana a Bea deja a Ana sin cuenta', '00000000-0000-4000-a000-000000000001',
  $$select public.guardar_profesional('00000000-0000-4000-b000-000000000002', 'Bea', 'Prueba', '#D4A373', true, '{}', '00000000-0000-4000-a000-000000000002')$$, 'ok');
select pg_temp.probar('…Ana ya no tiene cuenta vinculada', 'postgres',
  $$select 1 from public.perfiles where profesional_id = '00000000-0000-4000-b000-000000000001'$$, 'ok:0');

-- -----------------------------------------------------------------------------
-- Resumen
-- -----------------------------------------------------------------------------
select
  (select count(*) from resultados where paso) as pasaron,
  (select count(*) from resultados) as total,
  coalesce(
    (select string_agg(orden || '. ' || prueba || ' → esperado ' || esperado || ', obtenido ' || obtenido, E'\n' order by orden)
     from resultados where not paso),
    'Todas las pruebas pasaron'
  ) as detalle;

rollback;

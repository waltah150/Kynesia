-- =============================================================================
-- Catálogo del spa: horario de apertura, boxes, profesionales con sus horarios,
-- y servicios (grupos, subgrupos, paquetes y promociones).
--
-- Convenciones:
--   * dia_semana: 1 = lunes … 7 = domingo (norma ISO, igual que isodow de Postgres).
--   * Precios en guaraníes, enteros (sin decimales).
--   * Nada con historial se borra: se desactiva con activo / activa = false.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Horario del spa: uno o más rangos por día. Define qué horas muestra la agenda
-- y dentro de qué horas se pueden dar turnos.
-- -----------------------------------------------------------------------------
create table public.horario_spa (
  id uuid primary key default gen_random_uuid(),
  dia_semana smallint not null,
  apertura time not null,
  cierre time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint horario_spa_dia_valido check (dia_semana between 1 and 7),
  constraint horario_spa_rango_valido check (apertura < cierre),
  constraint horario_spa_pasos_15_min
    check (public.es_paso_15_min(apertura) and public.es_paso_15_min(cierre)),
  constraint horario_spa_sin_superposicion
    exclude using gist (dia_semana with =, public.rango_horario(apertura, cierre) with &&)
);

comment on table public.horario_spa is 'Días y horas de apertura del spa. Se cargan desde la app.';

-- -----------------------------------------------------------------------------
-- Boxes (salas de atención).
-- -----------------------------------------------------------------------------
create table public.boxes (
  id uuid primary key default gen_random_uuid(),
  numero smallint not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint boxes_numero_valido check (numero > 0)
);

comment on table public.boxes is 'Salas de atención. Un box no puede tener dos turnos a la vez.';

-- Los 4 boxes del spa son parte de su definición (CLAUDE.md §4.1), no datos de prueba.
insert into public.boxes (numero) values (1), (2), (3), (4);

-- -----------------------------------------------------------------------------
-- Profesionales.
-- -----------------------------------------------------------------------------
create table public.profesionales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  color text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profesionales_nombre_no_vacio check (length(trim(nombre)) > 0),
  constraint profesionales_apellido_no_vacio check (length(trim(apellido)) > 0),
  constraint profesionales_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on table public.profesionales is 'Profesionales del spa. color = color de sus turnos en la agenda (#RRGGBB).';

-- -----------------------------------------------------------------------------
-- Horario semanal fijo de cada profesional (puede tener varios rangos por día).
-- -----------------------------------------------------------------------------
create table public.horarios_profesional (
  id uuid primary key default gen_random_uuid(),
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  dia_semana smallint not null,
  inicio time not null,
  fin time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint horarios_profesional_dia_valido check (dia_semana between 1 and 7),
  constraint horarios_profesional_rango_valido check (inicio < fin),
  constraint horarios_profesional_pasos_15_min
    check (public.es_paso_15_min(inicio) and public.es_paso_15_min(fin)),
  constraint horarios_profesional_sin_superposicion
    exclude using gist (
      profesional_id with =,
      dia_semana with =,
      public.rango_horario(inicio, fin) with &&
    )
);

comment on table public.horarios_profesional is 'Horario semanal de cada profesional. Se repite todas las semanas hasta que se edite.';

-- -----------------------------------------------------------------------------
-- Grupos de servicios (ej. "Depilación láser", "Masajes").
-- -----------------------------------------------------------------------------
create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint grupos_nombre_no_vacio check (length(trim(nombre)) > 0)
);

-- Evita dos grupos con el mismo nombre (sin importar mayúsculas).
create unique index grupos_nombre_unico on public.grupos (lower(trim(nombre)));

-- -----------------------------------------------------------------------------
-- Servicios (los "subgrupos" de la interfaz): lo que se agenda.
-- -----------------------------------------------------------------------------
create table public.servicios (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete restrict,
  nombre text not null,
  duracion_min integer not null,
  precio integer not null,
  orden integer not null default 0,
  activo boolean not null default true,
  visible_web boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint servicios_nombre_no_vacio check (length(trim(nombre)) > 0),
  constraint servicios_duracion_valida check (duracion_min > 0 and duracion_min % 15 = 0),
  constraint servicios_precio_valido check (precio >= 0)
);

comment on table public.servicios is 'Servicios agendables. duracion_min en pasos de 15; precio en guaraníes.';
comment on column public.servicios.visible_web is 'Si se muestra en la futura web pública.';

create unique index servicios_nombre_unico_por_grupo
  on public.servicios (grupo_id, lower(trim(nombre)));

-- -----------------------------------------------------------------------------
-- Qué servicios realiza cada profesional.
-- -----------------------------------------------------------------------------
create table public.profesional_servicios (
  profesional_id uuid not null references public.profesionales (id) on delete cascade,
  servicio_id uuid not null references public.servicios (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (profesional_id, servicio_id)
);

create index profesional_servicios_servicio_idx on public.profesional_servicios (servicio_id);

-- -----------------------------------------------------------------------------
-- Paquetes por sesiones (ej. 6 sesiones a precio especial). Por ahora solo
-- registran el precio; no llevan la cuenta de sesiones usadas (CLAUDE.md §8).
-- -----------------------------------------------------------------------------
create table public.paquetes (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid not null references public.servicios (id) on delete restrict,
  sesiones integer not null,
  precio integer not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint paquetes_sesiones_validas check (sesiones >= 2),
  constraint paquetes_precio_valido check (precio >= 0)
);

create index paquetes_servicio_idx on public.paquetes (servicio_id);

-- -----------------------------------------------------------------------------
-- Promociones temporales de un servicio o de un paquete.
-- "Vencida" no se guarda: se calcula comparando fin con la fecha de hoy.
-- -----------------------------------------------------------------------------
create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  servicio_id uuid references public.servicios (id) on delete restrict,
  paquete_id uuid references public.paquetes (id) on delete restrict,
  precio integer not null,
  inicio date not null,
  fin date not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint promociones_servicio_o_paquete check (num_nonnulls(servicio_id, paquete_id) = 1),
  constraint promociones_precio_valido check (precio >= 0),
  constraint promociones_fechas_validas check (inicio <= fin)
);

comment on table public.promociones is 'Precio especial entre inicio y fin (ambos incluidos). Aplica a un servicio O a un paquete.';

create index promociones_servicio_idx on public.promociones (servicio_id);
create index promociones_paquete_idx on public.promociones (paquete_id);

-- -----------------------------------------------------------------------------
-- updated_at automático.
-- -----------------------------------------------------------------------------
create trigger horario_spa_updated_at before update on public.horario_spa
  for each row execute function public.actualizar_updated_at();
create trigger boxes_updated_at before update on public.boxes
  for each row execute function public.actualizar_updated_at();
create trigger profesionales_updated_at before update on public.profesionales
  for each row execute function public.actualizar_updated_at();
create trigger horarios_profesional_updated_at before update on public.horarios_profesional
  for each row execute function public.actualizar_updated_at();
create trigger grupos_updated_at before update on public.grupos
  for each row execute function public.actualizar_updated_at();
create trigger servicios_updated_at before update on public.servicios
  for each row execute function public.actualizar_updated_at();
create trigger paquetes_updated_at before update on public.paquetes
  for each row execute function public.actualizar_updated_at();
create trigger promociones_updated_at before update on public.promociones
  for each row execute function public.actualizar_updated_at();

# Kynesia Spa · Agenda interna — Documento de proyecto

> Este archivo da contexto a Claude Code. Léelo completo antes de escribir código.
> Trabaja por fases (ver "Plan de trabajo"). No avances de fase sin que yo lo confirme.
> Idioma de la interfaz: español. Zona horaria: America/Asuncion. Moneda: guaraníes (Gs.), sin decimales.

---

## 1. Qué es

Sistema web **interno** para agendar turnos de un spa. Lo usan 3 personas: la dueña, su ayudante y las profesionales.
No es la web pública del spa; esa se construirá después y **reutilizará la misma base de datos** (sobre todo servicios, precios, profesionales y disponibilidad). Por eso el modelo de datos debe pensarse desde ya para ser compartido.

Objetivos de calidad: fácil de usar desde computadora y celular, rápido para cargar turnos, código limpio y documentado (el repositorio es público y forma parte de mi portafolio).

---

## 1.1 Identidad visual (Kynesia Spa)

Estilo: **sencillo, formal y elegante**, coherente con el logo (hoja dorada de líneas finas sobre verde oliva). Mucho espacio en blanco, bordes finos, sin sombras fuertes ni colores chillones.

**Logo**: archivo en `public/logo-kynesia.jpeg`. Usarlo en la pantalla de login (grande, sobre fondo verde) y en el menú lateral (pequeño).

**Paleta** (definir como variables CSS / tokens de Tailwind, no repetir los códigos sueltos en el código):

| Token | Color | Uso |
|---|---|---|
| `verde-oliva` | `#3F4824` | Color principal: menú lateral, encabezados, botones principales, login |
| `verde-oliva-claro` | `#5C6638` | Hover y estados activos |
| `dorado` | `#C9A44C` | Acentos: línea del día actual, ítem activo del menú, íconos, bordes destacados |
| `dorado-claro` | `#E3D3A1` | Texto sobre fondo verde, fondos suaves de selección |
| `crema` | `#F7F4EC` | Fondo general de la app |
| `blanco` | `#FFFFFF` | Tarjetas, formularios y grilla de la agenda |
| `texto` | `#2B2F1E` | Texto principal |
| `texto-suave` | `#6E6F62` | Textos secundarios y horas de la grilla |
| `alerta` | `#B5652B` | Signo "!" y avisos (terracota, armoniza con la paleta) |

- La agenda va sobre fondo claro (crema/blanco) para leerse bien muchas horas; el verde oliva se reserva para el marco (menú, encabezado, botones).
- Colores de las profesionales en la agenda: tonos suaves y armónicos (salvia, arena, terracota claro, azul grisáceo…), con buen contraste para el texto.
- Respetar contraste accesible (AA) en todo texto.

**Tipografía** (Google Fonts, cargadas con `next/font`):
- Títulos y nombre de secciones: **Cormorant Garamond** (serif fina y formal, similar a "KYNESIA" del logo).
- Textos, formularios, botones y la grilla de la agenda: **Jost** (sans serif limpia y geométrica, similar a "SPA" del logo).
- Títulos con algo de espaciado entre letras; nada de negritas pesadas.

---

## 2. Stack

| Parte | Herramienta | Motivo |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Estándar del mercado, sirve también para la futura web pública |
| Estilos / componentes | Tailwind CSS + shadcn/ui | Componentes accesibles (selects con búsqueda, modales, tabs) |
| Calendario | FullCalendar (vistas gratuitas: día, semana, mes) | Grilla de 15 min, navegación, arrastrar y soltar |
| Base de datos + login | Supabase (Postgres + Auth) | Plan gratuito, seguridad por filas (RLS) |
| Validación | Zod | Validar formularios y datos antes de guardar |
| Hosting | Netlify (plan gratuito) | Gratis y permite uso comercial; deploy automático desde GitHub |
| Fechas | date-fns + date-fns-tz | Manejo correcto de zona horaria |

Nota: las vistas "por recurso" de FullCalendar (una columna por profesional o por box) son de pago. Si se necesitan, construir una vista de día propia con columnas por profesional.

---

## 3. Usuarios y permisos

- **Sin registro público.** Las cuentas se crean por invitación desde Supabase.
- Roles:
  - `admin` (dueña y ayudante): acceso total.
  - `profesional`: ver agenda, crear, mover y cancelar turnos, crear clientes. No edita precios, servicios ni horarios de otras profesionales.
- Los permisos se aplican en la base de datos (RLS), no solo ocultando botones.

---

## 4. Las 4 interfaces

### 4.1 Agenda

- Vistas: **Día, Semana, Mes**. Botones "Hoy", anterior, siguiente y selector de fecha para saltar rápido.
- Grilla cada **15 minutos** (10:00, 10:15, 10:30…), mostrando solo el horario de apertura del spa.
- Cada turno muestra: hora, cliente, servicio, profesional y box. Color según la profesional.
- Filtro por profesional y por box.
- **Al tocar un horario libre** se abre un formulario con:
  1. **Servicio**: lista desplegable con búsqueda, agrupada por categoría y subcategoría. La duración y el precio se completan solos.
  2. **Cliente**: lista desplegable con búsqueda por nombre, apellido o teléfono. Si no existe, botón "+ Nuevo cliente" que abre la creación de cliente y, al guardar, **vuelve al turno con el cliente ya seleccionado** (sin perder lo cargado).
  3. **Profesional**: solo muestra las disponibles en ese horario y durante toda la duración del servicio.
  4. **Box** (opcional): Box 1 a 4. Solo muestra los libres.
  5. Notas (opcional).
- Al tocar un turno existente: ver, editar, mover, cambiar estado o cancelar.
- Arrastrar y soltar para mover turnos, validando disponibilidad.
- **Validaciones** (en la base de datos, no solo en pantalla):
  - Una profesional no puede tener dos turnos superpuestos.
  - Un box no puede tener dos turnos superpuestos.
  - El turno debe estar dentro del horario del spa.
- **Alertas con signo "!"**:
  - Turnos cuya profesional ya no trabaja en ese horario (por un cambio de horario): se marcan con "!" para reasignarlos.
  - Franjas del horario de apertura en las que no hay ninguna profesional disponible: se sombrean con "!".

### 4.2 Clientes y Profesionales

Una sola pantalla con dos pestañas.

**Clientes**
- Campos: nombre, apellido, teléfono (obligatorios). Notas (opcional).
- Teléfono guardado en formato normalizado (+595…) y único, para evitar duplicados.
- Lista con búsqueda, editar y desactivar (no borrar, para conservar el historial).

**Profesionales**
- Se crean a mano desde esta pantalla. Sin límite de cantidad.
- Campos: nombre, apellido, color en la agenda, activa/inactiva, servicios que realiza.
- **Horario semanal fijo y editable**: para cada día de la semana, marcar si trabaja y cargar uno o más rangos en pasos de 15 min (ej. lunes 09:00–13:00 y 15:00–19:00). El horario se repite todas las semanas hasta que se modifique.
- **La agenda toma los horarios de aquí**: no hay horarios escritos en el código.
- Al guardar un cambio de horario, avisar cuántos turnos futuros quedan fuera del nuevo horario; esos turnos aparecen con "!" en la agenda.

**Horario del spa**
- Pequeña sección en esta misma pantalla para cargar a mano los días y horas de apertura. Define el rango visible de la agenda y permite detectar franjas sin profesional ("!").

### 4.3 Servicios y precios

- La pantalla empieza vacía: **todo se carga a mano**, no hay servicios escritos en el código.
- Dos niveles simples:
  - **Grupo**: solo un nombre (ej. "Depilación láser", "Masajes").
  - **Subgrupo**: el servicio que se agenda, dentro de un grupo, con nombre, **precio** y **duración** (elegida en pasos de 15 min). Ej. Depilación láser → Rostro · Gs. 150.000 · 30 min.
- Vista en forma de acordeón: cada grupo se despliega y muestra sus subgrupos, con botones "+ Grupo" y "+ Subgrupo" siempre a mano.
- Crear, editar y desactivar grupos y subgrupos con un formulario corto. Desactivar en lugar de borrar si ya tiene turnos.
- Este listado es el que alimenta la lista desplegable de servicios en la agenda.
- Opcional dentro de cada subgrupo:
  - **Paquetes por sesiones** con precio propio (ej. 6 sesiones, 10 sesiones).
  - **Promociones temporales**: precio especial con fecha de inicio y fin. Pasada la fecha de fin quedan **inactivas automáticamente** (se calcula por fecha) y se ven en una sección "Vencidas".
- Solo `admin` puede editar esta sección.

### 4.4 Historial de cliente

- Selector de cliente con búsqueda.
- Lista de **todos sus turnos**, pasados y futuros, con: fecha, hora, servicio, profesional, box, precio y estado.
- Estados: `reservado`, `confirmado`, `realizado`, `cancelado`, `no_asistió`.
- Filtros por estado y por rango de fechas. Totales: cantidad de turnos realizados y monto gastado.
- Desde aquí se puede agendar un turno nuevo para ese cliente.

---

## 5. Modelo de datos (borrador)

- `perfiles` — usuario de login, rol, profesional asociada (si aplica).
- `horario_spa` — día de la semana, hora de apertura y cierre.
- `boxes` — número (1 a 4), activo.
- `profesionales` — nombre, apellido, color, activa.
- `horarios_profesional` — profesional, día de la semana, inicio, fin (horario semanal fijo; puede haber varios rangos por día).
- `clientes` — nombre, apellido, teléfono (único), notas, activo.
- `grupos` — nombre, orden, activo.
- `servicios` (subgrupos) — grupo, nombre, duración_min, precio, activo, visible_web.
- `profesional_servicios` — qué profesional realiza qué servicio.
- `paquetes` — servicio, cantidad de sesiones, precio, activo.
- `promociones` — servicio o paquete; precio promocional; inicio; fin.
- `turnos` — cliente, servicio, profesional, box (opcional), inicio, fin, precio cobrado (copia del precio al momento de agendar), estado, notas, creado_por, google_event_id (vacío por ahora, para la futura sincronización con Google Calendar), origen (`interno` / `web`).

Reglas:
- Superposiciones bloqueadas con restricciones de exclusión de Postgres (extensión `btree_gist`) por profesional y por box, ignorando turnos cancelados.
- Fechas guardadas como `timestamptz`; se muestran en America/Asuncion.
- Nada se borra físicamente si tiene historial: se desactiva.
- Usar migraciones de Supabase versionadas en el repositorio (`supabase/migrations`).

---

## 6. Seguridad

- RLS activado en **todas** las tablas. Por defecto, sin acceso.
- Registro público desactivado en Supabase Auth; solo usuarios invitados.
- Solo la clave pública (`anon`) va en el frontend. La clave `service_role` **nunca** se usa en el navegador ni se sube a GitHub.
- Archivo `.env.local` en `.gitignore`. Incluir un `.env.example` sin valores reales.
- El repositorio es público: **nunca** subir datos reales de clientes. Los datos de prueba son inventados.
- Validar todos los formularios con Zod en cliente y servidor.
- Exportación manual de respaldo (CSV) de clientes y turnos desde la app, solo para `admin`.

---

## 7. Plan de trabajo por fases

1. **Base**: crear proyecto Next.js, Tailwind, shadcn/ui, conexión a Supabase, login, layout con menú de las 4 secciones. Deploy en Netlify.
2. **Base de datos**: migraciones con todas las tablas, restricciones y RLS. Sin servicios, horarios ni profesionales precargados: todo se carga desde la app. (Datos de prueba inventados solo en un archivo separado para desarrollo local, nunca en producción.)
3. **Servicios** (interfaz 3): grupos, subgrupos, paquetes y promociones.
4. **Clientes y profesionales** (interfaz 2): incluidos horarios semanales y horario del spa.
5. **Agenda** (interfaz 1): vistas, creación y edición de turnos, validaciones, alertas "!".
6. **Historial** (interfaz 4).
7. **Pulido**: diseño en celular, estados vacíos, mensajes de error claros, README para el portafolio con capturas.
8. **Futuro** (no hacer ahora): sincronización con Google Calendar, web pública con reservas online, mudanza al dominio del spa.

En cada fase: explicar qué se va a hacer, hacerlo, probarlo y hacer commit con un mensaje claro.

---

## 8. Decisiones tomadas

- Horarios, servicios, precios y profesionales **no se escriben en el código**: se cargan y modifican a mano desde las interfaces.
- Los horarios de las profesionales son semanales y permanentes hasta que se editen.
- Las profesionales pueden ver los turnos de las demás.
- Los paquetes por ahora solo registran el precio; no llevan la cuenta de sesiones usadas por cliente.

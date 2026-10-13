# Kynesia Spa · Agenda interna

Sistema web interno para agendar los turnos de Kynesia Spa (Asunción, Paraguay).

> Proyecto en construcción. Ver [`CLAUDE.md`](CLAUDE.md) para la especificación completa y el plan por fases.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase (Postgres + Auth) · Zod · Netlify

## Correr en local

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env.local` y completar con la URL y la clave pública (publishable) del proyecto de Supabase.
3. Iniciar: `npm run dev` y abrir http://localhost:3000

## Base de datos

El esquema vive en `supabase/migrations` (SQL versionado). Las reglas importantes se garantizan en Postgres, no solo en pantalla:

- Restricciones de exclusión (`btree_gist`): una profesional o un box no pueden tener turnos superpuestos (los cancelados no cuentan).
- Trigger que exige que cada turno caiga dentro del horario del spa, en pasos de 15 minutos (hora de Asunción).
- Seguridad por filas (RLS) en todas las tablas, con roles `admin` y `profesional`; el público anónimo no tiene acceso.

Comandos (requieren `npx supabase login` y `npx supabase link`):

- `npx supabase db push` — aplica las migraciones nuevas.
- `npm run db:probar` — corre las pruebas de [`supabase/tests/reglas.sql`](supabase/tests/reglas.sql) dentro de una transacción que se deshace al final (no deja datos).
- `npm run db:tipos` — regenera los tipos de TypeScript de la base.

## Estructura

- `src/app/login` — pantalla de inicio de sesión.
- `src/app/(app)` — pantallas internas (protegidas) con el menú lateral.
- `src/lib/supabase` — clientes de Supabase para navegador y servidor.
- `src/proxy.ts` — renueva la sesión y redirige a `/login` a quien no la inició.

# Kynesia Spa · Agenda interna

Sistema web interno para agendar los turnos de Kynesia Spa (Asunción, Paraguay).

> Proyecto en construcción. Ver [`CLAUDE.md`](CLAUDE.md) para la especificación completa y el plan por fases.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Supabase (Postgres + Auth) · Zod · Netlify

## Correr en local

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` como `.env.local` y completar con la URL y la clave pública (publishable) del proyecto de Supabase.
3. Iniciar: `npm run dev` y abrir http://localhost:3000

## Estructura

- `src/app/login` — pantalla de inicio de sesión.
- `src/app/(app)` — pantallas internas (protegidas) con el menú lateral.
- `src/lib/supabase` — clientes de Supabase para navegador y servidor.
- `src/proxy.ts` — renueva la sesión y redirige a `/login` a quien no la inició.

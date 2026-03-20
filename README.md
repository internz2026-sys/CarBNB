# carBNB

carBNB is a modern peer-to-peer car sharing platform built with Next.js, Prisma, Tailwind CSS, and PostgreSQL. The project includes a marketing landing page, public vehicle detail flow, role-based authentication screens, and an admin workspace for managing the marketplace.

## System Overview

This repository currently contains:

- a public landing page for renters and hosts
- a public car listing details page
- separate log-in and sign-up experiences for customers and car owners/hosts
- an admin dashboard and management pages for owners, listings, bookings, accounting, availability, reports, and settings
- a local PostgreSQL-ready Prisma schema for the system data model
- a design system documented in `DESIGN.md`

## Core Features

- Marketing homepage with scroll-based reveal animations
- Featured vehicle cards and public listing detail page
- Role-aware auth UI for:
  - customer
  - car owner / host
- Admin pages for:
  - dashboard
  - owners
  - car listings
  - bookings
  - accounting
  - availability calendar
  - reports
  - settings
- Prisma schema for:
  - users
  - owners
  - customers
  - car listings
  - bookings
  - accounting entries
  - payouts
  - availability rules and exceptions

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- shadcn/ui style component setup
- Lucide React icons

## Project Structure

```text
app/
  (admin)/           Admin workspace routes
  (auth)/            Log-in and sign-up routes
  listings/[id]/     Public listing detail route
  page.tsx           Landing page

components/
  layout/            Shared admin shell components
  marketing/         Landing page and reveal components
  ui/                Reusable UI primitives

lib/
  data/              Mock data for the current UI
  db.ts              Shared Prisma client helper

prisma/
  schema.prisma      PostgreSQL schema
```

## Design System

The interface styling follows the shared design language documented in `DESIGN.md`, including:

- Manrope for editorial headlines
- Inter for body and interface text
- layered soft-surface backgrounds
- deep blue primary actions
- glass and elevated card treatments
- responsive admin and marketplace layouts

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and update it if needed:

```bash
DATABASE_URL="postgresql://postgres:password123@localhost:5432/carbnb_admin?schema=public"
```

### 3. Start PostgreSQL

You can use your own local PostgreSQL install, or the included Docker container.

Start the included Docker database with:

```bash
npm run db:up
```

Default Docker database values:

- host: `localhost`
- port: `5432`
- user: `postgres`
- password: `password123`
- database: `carbnb_admin`

Stop it with:

```bash
npm run db:down
```

### 4. Prepare Prisma

```bash
npm run db:generate
npm run db:migrate
```

Additional Prisma tools:

```bash
npm run db:push
npm run db:studio
npm run db:validate
```

## Running the App

Start the development server:

```bash
npm run dev
```

Or on Windows:

```bash
run.bat
```

Open the app at:

- `http://localhost:3000/` for the landing page
- `http://localhost:3000/login` for log-in
- `http://localhost:3000/signup` for sign-up
- `http://localhost:3000/dashboard` for the admin dashboard

## Current Data Layer Status

The project is prepared for PostgreSQL through Prisma, but much of the current UI still renders from local mock data while the visual flows are being finalized. The shared Prisma client helper is available in `lib/db.ts` for the next step of wiring pages to the database.

## Deployment Notes

For local development, PostgreSQL on `localhost` is fine.

For production hosting, a Vercel deployment cannot connect to your machine's local database. Use a hosted or publicly reachable PostgreSQL instance for deployment, such as:

- Supabase Postgres
- Neon
- Railway
- a self-managed VPS with PostgreSQL

## Branching

The repository is prepared to use:

- `main` for stable project history
- `feature` for active development work

## License

This project is currently maintained as a private/internal system unless you choose to publish it under a specific license.

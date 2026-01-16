# SUPERMATT Admin

Admin Dashboard for SUPERMATT App Suite.

## Features

- User Management (CRUD, roles, permissions)
- App Management (register apps, configure SSO)
- Access Control (grant/revoke app access)
- Analytics & Stats

## Auth

Uses Supabase Auth via supermatt-auth portal.
Only users with role="admin" can access.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Supabase (Auth + Database)
- React Router v7

## Setup

1. Kopiere `.env.example` zu `.env.local`
2. Trage deine Supabase Credentials ein
3. `npm install`
4. `npm run dev`

## Environment Variables

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

## Deployment

Das Projekt ist fuer Vercel optimiert. Push zu `main` triggert Auto-Deploy.

URL: https://admin.supermatt.agency

## Related Projects

- [supermatt-auth](https://github.com/michaeltobehn/supermatt-auth) - Auth Portal (SSO)
- [SM-TRAX](https://github.com/michaeltobehn/sm-trax) - Zeiterfassung
- [SM-Surveys](https://github.com/michaeltobehn/sm-surveys) - Umfragen

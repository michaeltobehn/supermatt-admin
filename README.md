# SUPERMATT Auth Portal

Minimal Auth Portal for SUPERMATT Apps - handles authentication only.

## Features

- Login mit Email/Password
- Login mit Google, GitHub, Apple (OAuth)
- Registrierung mit Email-Bestaetigung
- Passwort vergessen / zuruecksetzen
- Apps Dashboard (SSO Launcher)
- Profil-Einstellungen
- SSO Integration Docs

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Supabase (Auth + Database)
- Zustand (State Management)
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

URL: https://auth.supermatt.agency

## Related Projects

- [supermatt-admin](https://github.com/michaeltobehn/supermatt-admin) - Admin Portal (User/App Verwaltung)
- [SM-TRAX](https://github.com/michaeltobehn/sm-trax) - Zeiterfassung
- [SM-Surveys](https://github.com/michaeltobehn/sm-surveys) - Umfragen

# SuperMatt SSO Integration Guide

> Zentrales Single Sign-On für alle SuperMatt Apps

## Architektur-Übersicht

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│   Deine App     │────────▶│ auth.supermatt.agency│────────▶│  Supabase   │
│  (Client App)   │         │   (SSO Portal)       │         │    Auth     │
└─────────────────┘         └──────────────────────┘         └─────────────┘
        │                            │                              │
        │ 1. Redirect mit            │ 2. User Login                │
        │    ?redirect=callback      │    (Email/Google/GitHub)     │
        │                            │                              │
        │◀───────────────────────────│◀─────────────────────────────│
        │ 4. Redirect mit            │ 3. Supabase Session          │
        │    ?token=access_token     │                              │
        ▼                            │                              │
┌─────────────────┐                  │                              │
│ /api/auth/      │                  │                              │
│ sso-callback    │──────────────────┴──────────────────────────────┘
│ Token verify    │     5. Verifiziere Token gegen Supabase
└─────────────────┘
```

## SSO Flow im Detail

| Schritt | Aktion | Beschreibung |
|---------|--------|--------------|
| 1 | User klickt "Mit SuperMatt anmelden" | Redirect zu SSO Portal |
| 2 | Redirect zu `auth.supermatt.agency/login?redirect=<callback>` | Callback-URL mitgeben |
| 3 | User authentifiziert sich | Email/Password, Google, GitHub, Apple |
| 4 | SSO Portal redirected zurück | `<callback>?token=<access_token>` |
| 5 | Token-Verifikation gegen Supabase | `supabase.auth.getUser(token)` |
| 6 | Lokale Session erstellen | NextAuth JWT, Cookie, etc. |
| 7 | Redirect zu geschütztem Bereich | Dashboard, App, etc. |

---

## Integration für verschiedene Frameworks

### Next.js (App Router) mit NextAuth

#### 1. Abhängigkeiten installieren

```bash
npm install @supabase/supabase-js next-auth
```

#### 2. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SSO_URL=https://auth.supermatt.agency
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=eyJ...
NEXTAUTH_SECRET=<random-secret-32-chars>
NEXTAUTH_URL=http://localhost:3000
```

#### 3. SSO Callback Route erstellen

**Datei: `src/app/api/auth/sso-callback/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  try {
    // Token gegen Supabase verifizieren
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    // Optional: User in lokaler DB anlegen/aktualisieren
    // await ensureUser(user.id, user.email!, user.user_metadata?.full_name);

    // Cookie-Name bestimmen (wird auch als salt für JWT verwendet)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';

    // NextAuth Session erstellen
    const sessionToken = await encode({
      token: {
        userId: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        provider: 'supermatt',
        sub: user.id,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      salt: cookieName, // Wichtig: NextAuth v5 verwendet Cookie-Name als salt
      maxAge: 30 * 24 * 60 * 60, // 30 Tage
    });

    // Cookie setzen
    const cookieStore = await cookies();

    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('SSO callback error:', error);
    return NextResponse.redirect(new URL('/login?error=sso_failed', request.url));
  }
}
```

#### 4. Login Button implementieren

```tsx
// src/app/(auth)/login/page.tsx
'use client';

const handleSuperMattLogin = () => {
  const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL || 'https://auth.supermatt.agency';
  const callbackUrl = encodeURIComponent(window.location.origin + '/api/auth/sso-callback');
  window.location.href = `${ssoUrl}/login?redirect=${callbackUrl}`;
};

// In JSX:
<Button onClick={handleSuperMattLogin}>
  Mit SuperMatt anmelden
</Button>
```

---

### React (Vite/CRA) - Standalone

#### 1. Abhängigkeiten

```bash
npm install @supabase/supabase-js
```

#### 2. SSO Login implementieren

```tsx
// src/pages/Login.tsx
const SSO_URL = 'https://auth.supermatt.agency';

const handleSSOLogin = () => {
  const callbackUrl = encodeURIComponent(window.location.origin + '/auth/callback');
  window.location.href = `${SSO_URL}/login?redirect=${callbackUrl}`;
};
```

#### 3. Callback Route

```tsx
// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      navigate('/login?error=missing_token');
      return;
    }

    // Token verifizieren und User-Daten holen
    supabase.auth.getUser(token).then(({ data: { user }, error }) => {
      if (error || !user) {
        navigate('/login?error=invalid_token');
        return;
      }

      // User-Daten speichern (z.B. in Zustand, localStorage, Context)
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name,
      }));
      localStorage.setItem('sso_token', token);

      navigate('/dashboard');
    });
  }, [searchParams, navigate]);

  return <div>Authentifizierung...</div>;
}
```

---

### Express.js / Node.js Backend

```javascript
// routes/auth.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// SSO Callback
router.get('/sso-callback', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect('/login?error=missing_token');
  }

  try {
    // Token verifizieren
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.redirect('/login?error=invalid_token');
    }

    // Eigenen JWT erstellen
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.user_metadata?.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Cookie setzen
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('SSO error:', error);
    res.redirect('/login?error=sso_failed');
  }
});

// SSO Login initiieren
router.get('/login/sso', (req, res) => {
  const callbackUrl = encodeURIComponent(`${process.env.APP_URL}/auth/sso-callback`);
  res.redirect(`https://auth.supermatt.agency/login?redirect=${callbackUrl}`);
});

module.exports = router;
```

---

## Supabase Credentials

Alle SuperMatt Apps nutzen die **gleiche Supabase-Instanz**:

```env
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=eyJ...
```

> **Wichtig:** Die Credentials bekommst du vom Admin. Teile sie niemals öffentlich!

---

## Whitelist für Redirect URLs

Das SSO Portal akzeptiert nur Redirects zu bekannten Origins:

```typescript
// Aktuell erlaubte Origins (in auth.supermatt.agency)
const ALLOWED_REDIRECT_ORIGINS = [
  'https://subz.supermatt.agency',
  'https://trax.supermatt.agency',
  'https://supermatt.agency',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];
```

**Neue App hinzufügen:**
1. PR an `supermatt-sso` Repo mit neuer Origin in der Whitelist
2. Oder: Admin kontaktieren

---

## User-Daten aus dem Token

Nach erfolgreicher Verifikation erhältst du folgende User-Daten:

```typescript
interface SupabaseUser {
  id: string;                    // UUID
  email: string;                 // User Email
  user_metadata: {
    full_name?: string;          // Voller Name (wenn gesetzt)
    avatar_url?: string;         // Profilbild URL
  };
  app_metadata: {
    provider?: string;           // 'email', 'google', 'github', etc.
  };
}
```

---

## Fehlerbehandlung

| Error Code | Bedeutung | Lösung |
|------------|-----------|--------|
| `missing_token` | Kein Token in URL | User erneut zum SSO schicken |
| `invalid_token` | Token ungültig/abgelaufen | Neu authentifizieren |
| `sso_failed` | Allgemeiner Fehler | Logs prüfen, Support kontaktieren |
| `config_error` | Env-Variablen fehlen | `.env` prüfen |

---

## Sicherheitshinweise

1. **Token nur serverseitig verifizieren** - Niemals nur clientseitig prüfen
2. **HTTPS verwenden** - In Production immer SSL
3. **Token nicht loggen** - Access Tokens sind sensibel
4. **Kurze Token-Gültigkeit** - Supabase Tokens laufen nach 1h ab
5. **Whitelist prüfen** - Nur bekannte Redirect-URLs akzeptieren

---

## Beispiel-Implementierungen

| Projekt | Framework | Repo |
|---------|-----------|------|
| SM-Subz | Next.js 14 + NextAuth | `SM-Subz/subscout` |
| SM-TRAX | Next.js + Lucia | `SM-TRAX/trax` |
| SSO Portal | React + Vite | `supermatt-sso` |

---

## Support

- **Technische Fragen:** GitHub Issues im jeweiligen Repo
- **Neue App zur Whitelist:** PR an `supermatt-sso`
- **Supabase Credentials:** Admin kontaktieren

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2026-01-12 | Initial Version - Token-basiertes SSO |


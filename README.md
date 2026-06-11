# Cafe Management Frontend (Phase 1)

Next.js App Router frontend for:
- Cookie-based authentication flow
- Role-aware protected shell
- Dynamic menu sidebar from `/menus/authorized`
- Staff list and create flow (with Zod + React Hook Form)
- Premium responsive login page

## Setup

1. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
2. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## Build

```bash
npm run build
npm run start
```

## Deploy (Netlify + Railway)

Auth cookies must be set on the **Netlify domain** so `middleware.ts` can read them on `/dashboard`. The frontend proxies `/api/*` to Railway via [`netlify.toml`](./netlify.toml).

### Netlify

1. Set **Base directory** to `frontend`.
2. Environment variables (then redeploy — `NEXT_PUBLIC_*` are build-time):

   | Variable | Production value |
   |----------|----------------|
   | `API_URL` | `https://cafe-management-backend-production.up.railway.app` |
   | `NEXT_PUBLIC_API_URL` | `https://dinenepal.netlify.app/api` |
   | `NEXT_PUBLIC_APP_URL` | `https://dinenepal.netlify.app` |
   | `NEXT_PUBLIC_AUTH_COOKIE_NAME` | `cms_access_token` |

3. After login, DevTools → Cookies on `dinenepal.netlify.app` should show `cms_access_token`.

### Railway

```env
NODE_ENV=production
CORS_ORIGIN=https://dinenepal.netlify.app
FRONTEND_URL=https://dinenepal.netlify.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
```

Leave `COOKIE_DOMAIN` empty when using the Netlify `/api` proxy.

## Main Routes

- `/login`
- `/dashboard`
- `/users`

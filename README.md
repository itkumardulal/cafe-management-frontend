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

## Main Routes

- `/login`
- `/dashboard`
- `/users`

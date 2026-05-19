# Hostel Allocation Platform Deployment Guide

This project has three production pieces:

- Backend: Express + TypeScript + Prisma
- Frontend: React + Vite static build
- Database: PostgreSQL or Supabase PostgreSQL

## 1. Database

Use PostgreSQL locally, Supabase, Neon, Railway Postgres, or Render Postgres.

For Supabase:

1. Create a Supabase project.
2. Use the pooler URL for `DATABASE_URL`.
3. Use the direct URL for `DIRECT_URL`.
4. Run migrations:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
```

Only run sample seed data when you want demo users:

```bash
npm run db:seed
```

## 2. Backend

Required production env:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_ACCESS_SECRET="long-random-secret"
JWT_REFRESH_SECRET="different-long-random-secret"
CORS_ORIGIN="https://your-frontend-domain.com"
TRUST_PROXY=true
LOG_LEVEL=info
```

Build and run:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
npm start
```

Health checks:

```text
GET /health
GET /ready
```

Realtime:

```text
wss://your-backend-domain.com/realtime?token=JWT_ACCESS_TOKEN
```

## 3. Frontend

Required production env when frontend and backend are on different domains:

```env
VITE_API_BASE_URL="https://your-backend-domain.com/api"
VITE_REALTIME_URL="wss://your-backend-domain.com/realtime"
```

Build:

```bash
cd frontend
npm ci
npm run build
```

Deploy `frontend/dist` to Vercel, Netlify, Cloudflare Pages, static hosting, or Nginx.

## 4. Docker Compose Local Production Test

From repo root:

```bash
docker compose up --build
```

Open:

```text
http://localhost:8080
```

Backend:

```text
http://localhost:4000/health
```

Replace the placeholder JWT secrets before using Docker outside local testing.

## Demo Credentials

If seeded:

```text
Admin: admin@example.edu / Password@123
Student: 22CSE001 / Password@123
```

Change seeded passwords before any real deployment.

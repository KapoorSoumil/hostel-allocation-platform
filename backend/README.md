# Hostel Allocation Backend

Express + TypeScript backend for the hostel allocation platform.

## Stack

- Node.js
- Express
- TypeScript
- PostgreSQL / Supabase PostgreSQL
- Prisma ORM
- JWT middleware skeleton
- Pino logging
- Prisma migrations
- WebSocket realtime updates

## Setup

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

## Environment

Set `DATABASE_URL` in `.env`.

For local PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hostel_allocation?schema=public"
```

For Supabase:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public"
```

Use the connection string from Supabase project settings and replace the password placeholder.
Use the pooler URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`.

## Useful Scripts

```bash
npm run dev
npm run build
npm start
npm run start:migrate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:deploy
npm run db:seed
npm run db:validate
```

## Sample Data

The seed script creates:

- One admin user: `admin@example.edu`
- Ten ranked sample students
- Five room categories: `1-bed`, `2-bed`, `3-bed`, `4-bed`, `6-bed`
- Three hostel blocks
- Forty-five sample rooms
- Two counseling slots

Seeded users use this temporary password:

```text
Password@123
```

## Supabase Notes

Detailed Supabase setup instructions are in [docs/supabase-setup.md](docs/supabase-setup.md).

## Health Check

```text
GET /health
GET /ready
```

## API Base

```text
/api/auth
/api/students
/api/counseling-slots
/api/hostels
/api/rooms
/api/roommates
/api/allocations
/api/admin
```

Realtime:

```text
ws://localhost:4000/realtime?token=ACCESS_TOKEN
```

## Production

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
npm start
```

Docker:

```bash
docker build -t hostel-allocation-backend .
docker run --env-file .env -p 4000:4000 hostel-allocation-backend
```

See the root `DEPLOYMENT.md` for full deployment steps.

Hostel browsing APIs:

```text
GET /api/hostels
GET /api/hostels/:id/rooms
GET /api/hostels/:id/rooms?categoryId=ROOM_CATEGORY_ID&search=101
GET /api/rooms/:id
```

## Authentication Flow

Student login:

```bash
curl -X POST http://localhost:4000/api/auth/student/login ^
  -H "Content-Type: application/json" ^
  -d "{\"registrationNumber\":\"22CSE001\",\"password\":\"Password@123\"}"
```

Admin login:

```bash
curl -X POST http://localhost:4000/api/auth/admin/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@example.edu\",\"password\":\"Password@123\"}"
```

Use the returned access token for protected routes:

```bash
curl http://localhost:4000/api/auth/me ^
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Protected route examples:

```text
GET /api/auth/student-only
GET /api/auth/admin-only
```

Refresh token:

```bash
curl -X POST http://localhost:4000/api/auth/refresh-token ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
```

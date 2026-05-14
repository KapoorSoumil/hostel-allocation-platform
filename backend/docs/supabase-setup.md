# Supabase PostgreSQL Setup

Phase 2 supports Supabase PostgreSQL through Prisma.

## 1. Create Supabase Project

Create a Supabase project and open:

```text
Project Settings -> Database -> Connection string
```

## 2. Configure Environment

Copy the example file:

```bash
copy .env.example .env
```

For Supabase, Prisma should use two URLs:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?schema=public"
```

Use:

- `DATABASE_URL` for pooled application queries.
- `DIRECT_URL` for migrations.

## 3. Run Migration

```bash
npm run prisma:migrate
```

For production deployment:

```bash
npm run prisma:deploy
```

## 4. Seed Sample Data

```bash
npm run db:seed
```

Seeded users use:

```text
Password@123
```

## 5. Inspect Database

```bash
npm run prisma:studio
```

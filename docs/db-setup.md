# SQLite Setup (Hybrid Mode)

Default storage is JSON. To use SQLite:

1) Install deps (once):
- `npm install` in `/Users/gaurav/csc/apps/api`

2) Set env:
- `STORAGE_MODE=sqlite`
- `DATABASE_URL=file:/Users/gaurav/csc/prisma/app.db`

3) Apply schema:
- Run SQL: `/Users/gaurav/csc/db/migrations/001_init.sql`

4) Seed services (optional):
- `/Users/gaurav/csc/db/seed/services.sql`

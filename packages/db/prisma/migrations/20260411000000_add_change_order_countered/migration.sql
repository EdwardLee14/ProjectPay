-- Adds COUNTERED to change-order workflow (idempotent for DBs that already have it).
-- If Prisma reports a checksum mismatch for this migration, run once on that database:
--   DELETE FROM "_prisma_migrations" WHERE migration_name = '20260411000000_add_change_order_countered';
-- then: pnpm exec prisma migrate deploy

DO $migration$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'ChangeOrderStatus'
      AND e.enumlabel = 'COUNTERED'
  ) THEN
    ALTER TYPE "ChangeOrderStatus" ADD VALUE 'COUNTERED';
  END IF;
END $migration$;

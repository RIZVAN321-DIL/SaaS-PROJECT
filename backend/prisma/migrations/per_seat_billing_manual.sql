-- ============================================================
-- MIGRATION: fixed-tier → per-seat billing + referral system
-- Применять вручную или через `prisma migrate deploy`
-- ============================================================

-- 1. Добавить реферальные поля в Organization
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "referralCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referredBy"   TEXT;

-- Заполнить referralCode для существующих организаций (8 символов hex upper)
UPDATE "Organization"
SET "referralCode" = UPPER(ENCODE(GEN_RANDOM_BYTES(4), 'hex'))
WHERE "referralCode" IS NULL;

-- Сделать поле NOT NULL и уникальным
ALTER TABLE "Organization"
  ALTER COLUMN "referralCode" SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Organization_referralCode_key'
  ) THEN
    ALTER TABLE "Organization" ADD CONSTRAINT "Organization_referralCode_key" UNIQUE ("referralCode");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Organization_referredBy_idx" ON "Organization"("referredBy");

-- 2. Добавить новые поля в Subscription
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "pricePerSeat"     INTEGER NOT NULL DEFAULT 99000,
  ADD COLUMN IF NOT EXISTS "quantity"         INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "freeMonthsCredit" INTEGER NOT NULL DEFAULT 0;

-- 3. Обновить quantity на реальное количество пользователей
UPDATE "Subscription" s
SET "quantity" = GREATEST(
  (SELECT COUNT(*) FROM "User" u WHERE u."organizationId" = s."organizationId"),
  1
);

-- 4. Удалить Plan-related поля из Subscription (planId → nullable уже был; просто drop FK и column)
ALTER TABLE "Subscription"
  DROP COLUMN IF EXISTS "planId";

-- 5. Удалить таблицу Plan (CASCADE чтобы убрать FK references)
DROP TABLE IF EXISTS "Plan" CASCADE;

-- ============================================================

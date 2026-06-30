ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

UPDATE "Organization" SET "referralCode" = UPPER(ENCODE(GEN_RANDOM_BYTES(4), 'hex')) WHERE "referralCode" IS NULL;

ALTER TABLE "Organization" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_referralCode_key" ON "Organization"("referralCode");

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "pricePerSeat" INTEGER NOT NULL DEFAULT 99000;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "freeMonthsCredit" INTEGER NOT NULL DEFAULT 0;

UPDATE "Subscription" s SET "quantity" = GREATEST((SELECT COUNT(*) FROM "User" u WHERE u."organizationId" = s."organizationId"), 1);

ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "planId";
DROP TABLE IF EXISTS "Plan" CASCADE;

-- DropForeignKey
ALTER TABLE "PendingSubscription" DROP CONSTRAINT "PendingSubscription_tenantId_fkey";

-- AlterTable
ALTER TABLE "PendingSubscription" ALTER COLUMN "tenantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PendingSubscription" ADD CONSTRAINT "PendingSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

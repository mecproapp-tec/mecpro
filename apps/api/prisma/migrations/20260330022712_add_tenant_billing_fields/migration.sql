/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PendingSubscription" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- AddForeignKey
ALTER TABLE "PendingSubscription" ADD CONSTRAINT "PendingSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

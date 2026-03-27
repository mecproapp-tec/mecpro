-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_clientId_fkey";

-- DropIndex
DROP INDEX "Appointment_tenantId_date_idx";

-- DropIndex
DROP INDEX "Estimate_createdAt_idx";

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

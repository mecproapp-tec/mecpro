-- Add missing indexes that exist in the database but are not in migration history
CREATE INDEX IF NOT EXISTS "Appointment_tenantId_date_idx" ON "Appointment" ("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Estimate_createdAt_idx" ON "Estimate" ("createdAt");

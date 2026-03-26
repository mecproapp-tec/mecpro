-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "pdf_generated_at" TIMESTAMP(3),
ADD COLUMN     "pdf_status" TEXT DEFAULT 'pending',
ADD COLUMN     "pdf_url" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "pdf_generated_at" TIMESTAMP(3),
ADD COLUMN     "pdf_status" TEXT DEFAULT 'pending',
ADD COLUMN     "pdf_url" TEXT;

-- CreateIndex
CREATE INDEX "Estimate_pdf_url_idx" ON "Estimate"("pdf_url");

-- CreateIndex
CREATE INDEX "Estimate_pdf_status_idx" ON "Estimate"("pdf_status");

-- CreateIndex
CREATE INDEX "Estimate_tenantId_pdf_status_idx" ON "Estimate"("tenantId", "pdf_status");

-- CreateIndex
CREATE INDEX "Invoice_pdf_url_idx" ON "Invoice"("pdf_url");

-- CreateIndex
CREATE INDEX "Invoice_pdf_status_idx" ON "Invoice"("pdf_status");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_pdf_status_idx" ON "Invoice"("tenantId", "pdf_status");

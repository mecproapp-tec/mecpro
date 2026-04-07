-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "pdf_key" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "pdf_key" TEXT;

-- AlterTable
ALTER TABLE "PublicShare" ALTER COLUMN "pdfUrl" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Estimate_pdf_key_idx" ON "Estimate"("pdf_key");

-- CreateIndex
CREATE INDEX "Invoice_pdf_key_idx" ON "Invoice"("pdf_key");

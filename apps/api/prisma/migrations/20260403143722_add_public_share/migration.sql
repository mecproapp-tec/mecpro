-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('ESTIMATE', 'INVOICE');

-- CreateTable
CREATE TABLE "PublicShare" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "ShareType" NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicShare_token_key" ON "PublicShare"("token");

-- CreateIndex
CREATE INDEX "PublicShare_token_idx" ON "PublicShare"("token");

-- CreateIndex
CREATE INDEX "PublicShare_tenantId_idx" ON "PublicShare"("tenantId");

-- CreateIndex
CREATE INDEX "PublicShare_type_resourceId_idx" ON "PublicShare"("type", "resourceId");

-- AddForeignKey
ALTER TABLE "PublicShare" ADD CONSTRAINT "PublicShare_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

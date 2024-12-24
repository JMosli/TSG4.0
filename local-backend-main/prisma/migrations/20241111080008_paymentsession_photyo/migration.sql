/*
  Warnings:

  - Added the required column `clientId` to the `PaymentSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentSession" ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "photos" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "is_full" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

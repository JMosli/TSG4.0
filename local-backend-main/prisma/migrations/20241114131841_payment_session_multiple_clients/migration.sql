/*
  Warnings:

  - You are about to drop the column `clientId` on the `PaymentSession` table. All the data in the column will be lost.
  - The `photos` column on the `PaymentSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_clientId_fkey";

-- AlterTable
ALTER TABLE "PaymentSession" DROP COLUMN "clientId",
DROP COLUMN "photos",
ADD COLUMN     "photos" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "_ClientToPaymentSession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClientToPaymentSession_AB_unique" ON "_ClientToPaymentSession"("A", "B");

-- CreateIndex
CREATE INDEX "_ClientToPaymentSession_B_index" ON "_ClientToPaymentSession"("B");

-- AddForeignKey
ALTER TABLE "_ClientToPaymentSession" ADD CONSTRAINT "_ClientToPaymentSession_A_fkey" FOREIGN KEY ("A") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientToPaymentSession" ADD CONSTRAINT "_ClientToPaymentSession_B_fkey" FOREIGN KEY ("B") REFERENCES "PaymentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

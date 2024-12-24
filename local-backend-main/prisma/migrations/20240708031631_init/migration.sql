/*
  Warnings:

  - Added the required column `rangeId` to the `PaymentTerminal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentTerminal" ADD COLUMN     "rangeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PaymentTerminal" ADD CONSTRAINT "PaymentTerminal_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

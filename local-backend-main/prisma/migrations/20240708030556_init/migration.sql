/*
  Warnings:

  - You are about to drop the column `paymentTerminalId` on the `Kiosk` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Kiosk" DROP CONSTRAINT "Kiosk_paymentTerminalId_fkey";

-- DropIndex
DROP INDEX "Kiosk_paymentTerminalId_key";

-- AlterTable
ALTER TABLE "Kiosk" DROP COLUMN "paymentTerminalId";

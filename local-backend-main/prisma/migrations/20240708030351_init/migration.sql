-- DropForeignKey
ALTER TABLE "Kiosk" DROP CONSTRAINT "Kiosk_paymentTerminalId_fkey";

-- AlterTable
ALTER TABLE "Kiosk" ALTER COLUMN "paymentTerminalId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Kiosk" ADD CONSTRAINT "Kiosk_paymentTerminalId_fkey" FOREIGN KEY ("paymentTerminalId") REFERENCES "PaymentTerminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

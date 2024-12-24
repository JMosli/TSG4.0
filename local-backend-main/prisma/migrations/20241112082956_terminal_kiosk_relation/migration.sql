-- AlterTable
ALTER TABLE "Kiosk" ADD COLUMN     "paymentTerminalId" INTEGER;

-- AddForeignKey
ALTER TABLE "Kiosk" ADD CONSTRAINT "Kiosk_paymentTerminalId_fkey" FOREIGN KEY ("paymentTerminalId") REFERENCES "PaymentTerminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

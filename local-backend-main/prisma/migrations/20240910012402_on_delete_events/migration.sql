-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_cameraId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_kioskId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentTerminal" DROP CONSTRAINT "PaymentTerminal_rangeId_fkey";

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "cameraId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTerminal" ADD CONSTRAINT "PaymentTerminal_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_kioskId_fkey" FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

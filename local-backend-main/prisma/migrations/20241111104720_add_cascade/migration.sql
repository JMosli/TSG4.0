-- DropForeignKey
ALTER TABLE "PaymentSession" DROP CONSTRAINT "PaymentSession_clientId_fkey";

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

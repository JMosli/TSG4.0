-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rangeId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_rangeId_fkey";

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

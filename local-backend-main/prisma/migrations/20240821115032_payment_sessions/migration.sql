-- CreateTable
CREATE TABLE "PaymentSession" (
    "id" SERIAL NOT NULL,
    "video_ids" INTEGER[],
    "uid" TEXT NOT NULL,
    "kioskId" INTEGER NOT NULL,

    CONSTRAINT "PaymentSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentSession" ADD CONSTRAINT "PaymentSession_kioskId_fkey" FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

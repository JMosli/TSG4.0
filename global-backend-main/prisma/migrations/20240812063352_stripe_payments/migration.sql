-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "checkout_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "rangeId" INTEGER NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkout_id_key" ON "Payment"("checkout_id");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

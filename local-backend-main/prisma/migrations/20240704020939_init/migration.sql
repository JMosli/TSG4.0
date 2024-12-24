/*
  Warnings:

  - A unique constraint covering the columns `[kioskId]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `is_at_kiosk` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "is_at_kiosk" BOOLEAN NOT NULL,
ADD COLUMN     "kioskId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Camera_kioskId_key" ON "Camera"("kioskId");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_kioskId_fkey" FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

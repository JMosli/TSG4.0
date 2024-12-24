/*
  Warnings:

  - Added the required column `kiosk_id` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "kiosk_id" INTEGER NOT NULL;

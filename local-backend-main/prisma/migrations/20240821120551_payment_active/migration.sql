/*
  Warnings:

  - Added the required column `active` to the `PaymentSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentSession" ADD COLUMN     "active" BOOLEAN NOT NULL;

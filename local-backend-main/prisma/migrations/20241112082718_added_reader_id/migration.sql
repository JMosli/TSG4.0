/*
  Warnings:

  - Added the required column `reader_id` to the `PaymentTerminal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentTerminal" ADD COLUMN     "reader_id" TEXT NOT NULL;

/*
  Warnings:

  - The required column `uid` was added to the `Payment` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "uid" TEXT NOT NULL;

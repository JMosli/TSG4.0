/*
  Warnings:

  - Added the required column `access_key` to the `Kiosk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Kiosk" ADD COLUMN     "access_key" TEXT NOT NULL;

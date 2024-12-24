/*
  Warnings:

  - Added the required column `is_on_lane` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "is_on_lane" BOOLEAN NOT NULL;

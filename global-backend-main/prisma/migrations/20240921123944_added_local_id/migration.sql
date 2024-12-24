/*
  Warnings:

  - Added the required column `local_id` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "local_id" INTEGER NOT NULL;

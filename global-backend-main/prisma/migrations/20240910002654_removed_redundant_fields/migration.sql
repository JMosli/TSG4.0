/*
  Warnings:

  - You are about to drop the column `owner_range_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `so_range_id` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "owner_range_id",
DROP COLUMN "so_range_id";

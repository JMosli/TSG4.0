/*
  Warnings:

  - You are about to drop the column `recorded` on the `Video` table. All the data in the column will be lost.
  - Added the required column `manually_recorded` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "recorded",
ADD COLUMN     "manually_recorded" BOOLEAN NOT NULL;

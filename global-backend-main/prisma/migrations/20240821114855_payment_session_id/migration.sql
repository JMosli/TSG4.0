/*
  Warnings:

  - You are about to drop the column `range_session_id` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `range_session_uid` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "range_session_id",
ADD COLUMN     "range_session_uid" TEXT NOT NULL;

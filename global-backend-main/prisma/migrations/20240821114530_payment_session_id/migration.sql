/*
  Warnings:

  - You are about to drop the column `kiosk_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `video_ids` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `range_session_id` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "kiosk_id",
DROP COLUMN "video_ids",
ADD COLUMN     "range_session_id" INTEGER NOT NULL;

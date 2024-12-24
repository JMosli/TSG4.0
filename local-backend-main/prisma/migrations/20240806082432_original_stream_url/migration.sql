/*
  Warnings:

  - Added the required column `original_stream_url` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "original_stream_url" TEXT NOT NULL;

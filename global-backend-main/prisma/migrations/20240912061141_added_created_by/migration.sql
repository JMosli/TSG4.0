-- AlterTable
ALTER TABLE "User" ADD COLUMN     "created_by_userId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_created_by_userId_fkey" FOREIGN KEY ("created_by_userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

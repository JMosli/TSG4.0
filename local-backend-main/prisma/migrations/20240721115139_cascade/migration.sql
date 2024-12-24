-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_clientId_fkey";

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

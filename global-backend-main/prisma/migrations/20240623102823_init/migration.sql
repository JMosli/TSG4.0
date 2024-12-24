-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_global_admin" BOOLEAN NOT NULL,
    "owner_range_id" INTEGER,
    "so_range_id" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Range" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "private_key_signer" TEXT NOT NULL,
    "private_key_range" TEXT NOT NULL,
    "public_key_range" TEXT NOT NULL,
    "public_key_checker" TEXT NOT NULL,

    CONSTRAINT "Range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rangeId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_so_of" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_owner_of" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_so_of_AB_unique" ON "_so_of"("A", "B");

-- CreateIndex
CREATE INDEX "_so_of_B_index" ON "_so_of"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_owner_of_AB_unique" ON "_owner_of"("A", "B");

-- CreateIndex
CREATE INDEX "_owner_of_B_index" ON "_owner_of"("B");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_so_of" ADD CONSTRAINT "_so_of_A_fkey" FOREIGN KEY ("A") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_so_of" ADD CONSTRAINT "_so_of_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_owner_of" ADD CONSTRAINT "_owner_of_A_fkey" FOREIGN KEY ("A") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_owner_of" ADD CONSTRAINT "_owner_of_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Range" (
    "id" SERIAL NOT NULL,
    "private_key_signer" TEXT NOT NULL,
    "public_key_checker" TEXT NOT NULL,
    "camera_subnet" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL,
    "global_id" INTEGER NOT NULL,

    CONSTRAINT "Range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camera" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "stream_url" TEXT NOT NULL,
    "streaming" BOOLEAN NOT NULL,
    "connected" BOOLEAN NOT NULL,
    "lane_name" TEXT NOT NULL,
    "disconnectedAt" TIMESTAMP(3),
    "rangeId" INTEGER NOT NULL,

    CONSTRAINT "Camera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "face_id" INTEGER NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "is_sold" BOOLEAN NOT NULL,
    "sold_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rangeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kiosk" (
    "id" SERIAL NOT NULL,
    "is_connected" BOOLEAN NOT NULL,
    "paymentTerminalId" INTEGER NOT NULL,
    "rangeId" INTEGER NOT NULL,

    CONSTRAINT "Kiosk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Display" (
    "id" SERIAL NOT NULL,
    "is_connected" BOOLEAN NOT NULL,
    "kioskId" INTEGER NOT NULL,

    CONSTRAINT "Display_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTerminal" (
    "id" SERIAL NOT NULL,
    "is_connected" BOOLEAN NOT NULL,

    CONSTRAINT "PaymentTerminal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kiosk_paymentTerminalId_key" ON "Kiosk"("paymentTerminalId");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kiosk" ADD CONSTRAINT "Kiosk_paymentTerminalId_fkey" FOREIGN KEY ("paymentTerminalId") REFERENCES "PaymentTerminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kiosk" ADD CONSTRAINT "Kiosk_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Display" ADD CONSTRAINT "Display_kioskId_fkey" FOREIGN KEY ("kioskId") REFERENCES "Kiosk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

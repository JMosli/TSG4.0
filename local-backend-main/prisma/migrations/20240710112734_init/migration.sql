-- CreateTable
CREATE TABLE "ConfigEntry" (
    "id" SERIAL NOT NULL,
    "must_reboot" BOOLEAN NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '0',

    CONSTRAINT "ConfigEntry_pkey" PRIMARY KEY ("id")
);

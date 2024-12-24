-- CreateIndex
CREATE INDEX "Event_createdAt_type_idx" ON "Event"("createdAt", "type");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateTable
CREATE TABLE "PollAnswer" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" INTEGER NOT NULL,
    "answer" INTEGER NOT NULL,
    "rangeId" INTEGER NOT NULL,

    CONSTRAINT "PollAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollAnswer_createdAt_question_answer_idx" ON "PollAnswer"("createdAt", "question", "answer");

-- AddForeignKey
ALTER TABLE "PollAnswer" ADD CONSTRAINT "PollAnswer_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

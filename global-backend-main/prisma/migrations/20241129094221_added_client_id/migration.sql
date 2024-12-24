TRUNCATE TABLE "PollAnswer";

-- DropIndex
DROP INDEX "PollAnswer_createdAt_question_answer_idx";

-- AlterTable
ALTER TABLE "PollAnswer" ADD COLUMN     "client_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "PollAnswer_question_answer_client_id_rangeId_idx" ON "PollAnswer"("question", "answer", "client_id", "rangeId");

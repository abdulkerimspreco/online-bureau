CREATE TABLE "AccountDeletionAudit" (
  "id" TEXT NOT NULL,
  "receiptCode" TEXT NOT NULL,
  "deletedEmail" TEXT NOT NULL,
  "deletedRole" "UserRole" NOT NULL,
  "hadCv" BOOLEAN NOT NULL DEFAULT false,
  "requestedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountDeletionAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountDeletionAudit_receiptCode_key" ON "AccountDeletionAudit"("receiptCode");
CREATE INDEX "AccountDeletionAudit_completedAt_idx" ON "AccountDeletionAudit"("completedAt");

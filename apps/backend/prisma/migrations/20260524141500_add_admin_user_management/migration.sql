ALTER TABLE "User"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "deactivatedAt" TIMESTAMP(3);

CREATE TABLE "AdminActionLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminActionLog_adminId_createdAt_idx"
ON "AdminActionLog"("adminId", "createdAt");

CREATE INDEX "AdminActionLog_targetUserId_createdAt_idx"
ON "AdminActionLog"("targetUserId", "createdAt");

ALTER TABLE "AdminActionLog"
ADD CONSTRAINT "AdminActionLog_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminActionLog"
ADD CONSTRAINT "AdminActionLog_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

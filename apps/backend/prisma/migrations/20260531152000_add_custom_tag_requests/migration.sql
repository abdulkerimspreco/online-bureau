DO $$
BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TAG_REQUEST_APPROVED';
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TAG_REQUEST_REJECTED';
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TAG_UPDATED';
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TAG_REMOVED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE "CustomTagRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "CustomTagRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "requestedName" TEXT NOT NULL,
  "status" "CustomTagRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "tagId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomTagRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomTagRequest_requesterId_createdAt_idx" ON "CustomTagRequest"("requesterId", "createdAt");
CREATE INDEX "CustomTagRequest_status_createdAt_idx" ON "CustomTagRequest"("status", "createdAt");

ALTER TABLE "CustomTagRequest"
ADD CONSTRAINT "CustomTagRequest_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomTagRequest"
ADD CONSTRAINT "CustomTagRequest_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomTagRequest"
ADD CONSTRAINT "CustomTagRequest_tagId_fkey"
FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

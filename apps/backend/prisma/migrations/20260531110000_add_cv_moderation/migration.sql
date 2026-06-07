ALTER TYPE "NotificationType" ADD VALUE 'CV_MODERATION_REVIEW_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'CV_MODERATION_CONSENT_GRANTED';
ALTER TYPE "NotificationType" ADD VALUE 'CV_MODERATION_CONSENT_DECLINED';
ALTER TYPE "NotificationType" ADD VALUE 'CV_MODERATION_DISMISSED';
ALTER TYPE "NotificationType" ADD VALUE 'CV_MODERATION_ESCALATED';

CREATE TYPE "CvModerationStatus" AS ENUM (
  'AWAITING_CONSENT',
  'PREVIEW_GRANTED',
  'DECLINED',
  'DISMISSED',
  'ESCALATED'
);

CREATE TABLE "CvModerationCase" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "cvId" TEXT NOT NULL,
  "flaggedByAdminId" TEXT NOT NULL,
  "reason" TEXT,
  "previousVisibility" "CVVisibility",
  "status" "CvModerationStatus" NOT NULL DEFAULT 'AWAITING_CONSENT',
  "consentDeadlineAt" TIMESTAMP(3) NOT NULL,
  "candidateRespondedAt" TIMESTAMP(3),
  "previewGrantedAt" TIMESTAMP(3),
  "previewExpiresAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CvModerationCase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CvModerationCase_candidateId_createdAt_idx"
ON "CvModerationCase"("candidateId", "createdAt");

CREATE INDEX "CvModerationCase_flaggedByAdminId_createdAt_idx"
ON "CvModerationCase"("flaggedByAdminId", "createdAt");

CREATE INDEX "CvModerationCase_status_createdAt_idx"
ON "CvModerationCase"("status", "createdAt");

ALTER TABLE "CvModerationCase"
ADD CONSTRAINT "CvModerationCase_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CvModerationCase"
ADD CONSTRAINT "CvModerationCase_cvId_fkey"
FOREIGN KEY ("cvId") REFERENCES "Cv"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CvModerationCase"
ADD CONSTRAINT "CvModerationCase_flaggedByAdminId_fkey"
FOREIGN KEY ("flaggedByAdminId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CvReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cvId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "strengthsJson" TEXT NOT NULL,
  "improvementsJson" TEXT NOT NULL,
  "suggestionsJson" TEXT NOT NULL,
  "keywordMatchesJson" TEXT,
  "structureScore" INTEGER NOT NULL,
  "clarityScore" INTEGER NOT NULL,
  "keywordScore" INTEGER NOT NULL,
  "completenessScore" INTEGER NOT NULL,
  "sourceCvUpdatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CvReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CvReview_userId_createdAt_idx"
ON "CvReview"("userId", "createdAt");

CREATE INDEX "CvReview_cvId_createdAt_idx"
ON "CvReview"("cvId", "createdAt");

ALTER TABLE "CvReview"
ADD CONSTRAINT "CvReview_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CvReview"
ADD CONSTRAINT "CvReview_cvId_fkey"
FOREIGN KEY ("cvId") REFERENCES "Cv"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

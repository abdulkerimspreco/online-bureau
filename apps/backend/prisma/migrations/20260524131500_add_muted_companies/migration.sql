CREATE TABLE "MutedCompany" (
  "candidateId" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MutedCompany_pkey" PRIMARY KEY ("candidateId","employerId")
);

CREATE INDEX "MutedCompany_candidateId_createdAt_idx"
ON "MutedCompany"("candidateId", "createdAt");

CREATE INDEX "MutedCompany_employerId_createdAt_idx"
ON "MutedCompany"("employerId", "createdAt");

ALTER TABLE "MutedCompany"
ADD CONSTRAINT "MutedCompany_candidateId_fkey"
FOREIGN KEY ("candidateId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MutedCompany"
ADD CONSTRAINT "MutedCompany_employerId_fkey"
FOREIGN KEY ("employerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

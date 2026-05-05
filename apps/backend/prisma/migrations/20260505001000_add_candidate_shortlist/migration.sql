-- CreateTable
CREATE TABLE "ShortlistEntry" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortlistEntry_employerId_candidateId_key" ON "ShortlistEntry"("employerId", "candidateId");

-- CreateIndex
CREATE INDEX "ShortlistEntry_employerId_createdAt_idx" ON "ShortlistEntry"("employerId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShortlistEntry" ADD CONSTRAINT "ShortlistEntry_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortlistEntry" ADD CONSTRAINT "ShortlistEntry_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

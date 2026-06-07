CREATE TABLE "ShortlistFolder" (
  "id" TEXT NOT NULL,
  "employerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShortlistFolder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShortlistFolderEntry" (
  "folderId" TEXT NOT NULL,
  "shortlistEntryId" TEXT NOT NULL,

  CONSTRAINT "ShortlistFolderEntry_pkey" PRIMARY KEY ("folderId","shortlistEntryId")
);

CREATE INDEX "ShortlistFolder_employerId_updatedAt_idx"
ON "ShortlistFolder"("employerId", "updatedAt");

CREATE INDEX "ShortlistFolderEntry_shortlistEntryId_idx"
ON "ShortlistFolderEntry"("shortlistEntryId");

ALTER TABLE "ShortlistFolder"
ADD CONSTRAINT "ShortlistFolder_employerId_fkey"
FOREIGN KEY ("employerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShortlistFolderEntry"
ADD CONSTRAINT "ShortlistFolderEntry_folderId_fkey"
FOREIGN KEY ("folderId") REFERENCES "ShortlistFolder"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShortlistFolderEntry"
ADD CONSTRAINT "ShortlistFolderEntry_shortlistEntryId_fkey"
FOREIGN KEY ("shortlistEntryId") REFERENCES "ShortlistEntry"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "SearchTagMode" AS ENUM ('ANY', 'ALL');

-- AlterTable
ALTER TABLE "SavedSearch"
ADD COLUMN "tagIdsJson" TEXT,
ADD COLUMN "tagMode" "SearchTagMode";

ALTER TABLE "User"
ADD COLUMN "verificationToken" TEXT,
ADD COLUMN "verificationTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

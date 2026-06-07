CREATE TYPE "OpsAlertSeverity" AS ENUM (
  'WARN',
  'CRITICAL'
);

CREATE TABLE "OpsAlert" (
  "id" TEXT NOT NULL,
  "metricKey" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "severity" "OpsAlertSeverity" NOT NULL,
  "thresholdMs" INTEGER NOT NULL,
  "observedMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),

  CONSTRAINT "OpsAlert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OpsAlert_metricKey_createdAt_idx"
ON "OpsAlert"("metricKey", "createdAt");

CREATE INDEX "OpsAlert_severity_createdAt_idx"
ON "OpsAlert"("severity", "createdAt");

export interface AdminOpsThreshold {
  metricKey: string;
  route: string;
  thresholdMs: number;
  description?: string;
}

export interface AdminOpsAlert {
  id: string;
  metricKey: string;
  route: string;
  message: string;
  severity: 'WARN' | 'CRITICAL';
  thresholdMs: number;
  observedMs: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminOpsResponse {
  status: 'healthy' | 'degraded';
  startedAt: string;
  uptimeSeconds: number;
  recentAlertCount: number;
  summary: {
    criticalAlertsLast24Hours: number;
    totalAlertsLast24Hours: number;
    uptimeTarget: string;
  };
  thresholds: AdminOpsThreshold[];
  alerts: AdminOpsAlert[];
}

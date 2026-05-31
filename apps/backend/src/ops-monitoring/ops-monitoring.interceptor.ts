import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OpsMonitoringService } from './ops-monitoring.service';

@Injectable()
export class OpsMonitoringInterceptor implements NestInterceptor {
  constructor(private readonly opsMonitoringService: OpsMonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method as string;
    const path =
      (request.baseUrl || '') +
      (request.route?.path && request.route.path !== '/'
        ? request.route.path
        : '');

    const matchedThreshold = this.opsMonitoringService.getMatchedThreshold(
      method,
      path,
    );

    if (!matchedThreshold) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const observedMs = Date.now() - startedAt;

          if (observedMs > matchedThreshold.thresholdMs) {
            void this.opsMonitoringService.recordThresholdBreach({
              metricKey: matchedThreshold.metricKey,
              route: matchedThreshold.route,
              thresholdMs: matchedThreshold.thresholdMs,
              observedMs,
            });
          }
        },
      }),
    );
  }
}

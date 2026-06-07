# NFR-01 Validation Guide

This guide supports local validation for the `NFR-01` performance and uptime work.

## What local validation can prove

- request timing instrumentation is active
- threshold breaches create alert records
- `/ops/health` and `/admin/ops` expose operational state
- rough search and upload latency on a developer machine

## What local validation cannot prove alone

- `10,000` concurrent users
- `99.5%` rolling 30-day uptime
- real production alert delivery guarantees

## Prerequisites

- backend running on `http://localhost:3000`
- frontend optional for viewing `/admin/ops`
- valid test accounts for:
  - employer benchmark
  - job seeker benchmark

## Search benchmark

Example:

```bash
BENCH_EMPLOYER_EMAIL=hr@buzzr.com \
BENCH_EMPLOYER_PASSWORD='your-password' \
BENCH_SEARCH_QUERY=react \
BENCH_SEARCH_LOCATION=Sarajevo \
BENCH_CONCURRENCY=10 \
BENCH_ITERATIONS=5 \
pnpm benchmark:search
```

This script logs in, runs repeated employer search requests, and prints:

- successful request count
- failure count
- average latency
- p50 latency
- p95 latency
- max latency

## Upload benchmark

Example:

```bash
BENCH_JOB_SEEKER_EMAIL=test@test.com \
BENCH_JOB_SEEKER_PASSWORD='your-password' \
BENCH_UPLOAD_SIZE_MB=1 \
BENCH_ITERATIONS=5 \
pnpm benchmark:upload
```

This script logs in as a job seeker and uploads a generated PDF payload repeatedly.

Note:

- the backend currently rejects payloads above `10 MB`
- multipart form uploads add transport overhead beyond the raw file size
- the benchmark script now caps the generated file slightly below the raw limit so a requested `10 MB` run still measures a near-limit upload instead of failing with `413 Payload Too Large`

## Ops endpoints

- public health:
  - `GET /ops/health`
- admin ops view:
  - `/admin/ops`

Threshold breaches currently tracked:

- `GET /employers/search` target: `2000ms`
- `POST /cv/upload` target: `5000ms`

## Interpreting results

- If average and p95 stay below threshold locally, that is a good sanity signal.
- If alerts appear in `/admin/ops`, instrumentation is working.
- Production-scale concurrency and uptime still require deployment-environment testing and monitoring.

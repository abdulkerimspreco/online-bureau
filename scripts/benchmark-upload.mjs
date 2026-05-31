import { getBaseUrl, loginAndGetCookie, summarizeDurations } from './lib/auth-session.mjs';

const jobSeekerEmail = process.env.BENCH_JOB_SEEKER_EMAIL;
const jobSeekerPassword = process.env.BENCH_JOB_SEEKER_PASSWORD;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_MULTIPART_OVERHEAD_BYTES = 64 * 1024;

if (!jobSeekerEmail || !jobSeekerPassword) {
  console.error(
    'Missing BENCH_JOB_SEEKER_EMAIL or BENCH_JOB_SEEKER_PASSWORD for upload benchmark.',
  );
  process.exit(1);
}

const iterations = Number(process.env.BENCH_ITERATIONS || 5);
const uploadSizeMb = Number(process.env.BENCH_UPLOAD_SIZE_MB || 1);
const multipartOverheadBytes = Number(
  process.env.BENCH_MULTIPART_OVERHEAD_BYTES || DEFAULT_MULTIPART_OVERHEAD_BYTES,
);
const baseUrl = getBaseUrl();

function getRequestedPayloadBytes(sizeMb) {
  return Math.max(1024, Math.floor(sizeMb * 1024 * 1024));
}

function getEffectivePayloadBytes(sizeMb) {
  const requestedBytes = getRequestedPayloadBytes(sizeMb);
  const safeLimitBytes = Math.max(1024, MAX_UPLOAD_BYTES - multipartOverheadBytes);
  return {
    requestedBytes,
    effectiveBytes: Math.min(requestedBytes, safeLimitBytes),
    capped: requestedBytes > safeLimitBytes,
  };
}

function createFakePdfBlob(payloadBytes) {
  const prefix = '%PDF-1.4\n% benchmark upload\n';
  const remainingBytes = Math.max(0, payloadBytes - Buffer.byteLength(prefix));
  const padding = 'A'.repeat(remainingBytes);
  return new Blob([prefix, padding], { type: 'application/pdf' });
}

async function main() {
  const cookie = await loginAndGetCookie({
    email: jobSeekerEmail,
    password: jobSeekerPassword,
  });

  const durations = [];
  let failures = 0;
  const { requestedBytes, effectiveBytes, capped } = getEffectivePayloadBytes(uploadSizeMb);
  const effectivePayloadMb = (effectiveBytes / (1024 * 1024)).toFixed(2);
  const requestedPayloadMb = (requestedBytes / (1024 * 1024)).toFixed(2);

  console.log(`Running CV upload benchmark against ${baseUrl}/cv/upload`);
  console.log(`Iterations: ${iterations}, requested payload: ${requestedPayloadMb}MB`);

  if (capped) {
    console.log(
      `Effective payload capped to ${effectivePayloadMb}MB to leave room for multipart overhead.`,
    );
  } else {
    console.log(`Effective payload: ${effectivePayloadMb}MB`);
  }

  for (let index = 0; index < iterations; index += 1) {
    const formData = new FormData();
    formData.append(
      'file',
      createFakePdfBlob(effectiveBytes),
      `benchmark-${uploadSizeMb}mb-${index + 1}.pdf`,
    );

    const startedAt = performance.now();

    try {
      const response = await fetch(`${baseUrl}/cv/upload`, {
        method: 'POST',
        headers: {
          Cookie: cookie,
        },
        body: formData,
      });

      if (!response.ok) {
        failures += 1;
        continue;
      }

      await response.text();
      durations.push(performance.now() - startedAt);
    } catch {
      failures += 1;
    }
  }

  summarizeDurations('CV upload benchmark summary', durations, failures);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

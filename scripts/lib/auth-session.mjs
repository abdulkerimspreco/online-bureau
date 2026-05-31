const DEFAULT_BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:3000';

export function getBaseUrl() {
  return DEFAULT_BASE_URL.replace(/\/$/, '');
}

export async function loginAndGetCookie({ email, password }) {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed for ${email}: ${text || response.statusText}`);
  }

  const setCookie = response.headers.get('set-cookie');

  if (!setCookie) {
    throw new Error(`Login succeeded for ${email}, but no auth cookie was returned.`);
  }

  return setCookie.split(';')[0];
}

export function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * ratio) - 1),
  );
  return sortedValues[index];
}

export function summarizeDurations(label, durations, failures) {
  const sorted = [...durations].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const avg = sorted.length > 0 ? total / sorted.length : 0;
  const p50 = percentile(sorted, 0.5);
  const p95 = percentile(sorted, 0.95);
  const max = sorted.length > 0 ? sorted[sorted.length - 1] : 0;

  console.log(`\n${label}`);
  console.log(`Successful requests: ${sorted.length}`);
  console.log(`Failures: ${failures}`);
  console.log(`Average: ${avg.toFixed(1)}ms`);
  console.log(`P50: ${p50.toFixed(1)}ms`);
  console.log(`P95: ${p95.toFixed(1)}ms`);
  console.log(`Max: ${max.toFixed(1)}ms`);
}

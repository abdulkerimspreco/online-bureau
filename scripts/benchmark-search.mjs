import { getBaseUrl, loginAndGetCookie, summarizeDurations } from './lib/auth-session.mjs';

const employerEmail = process.env.BENCH_EMPLOYER_EMAIL;
const employerPassword = process.env.BENCH_EMPLOYER_PASSWORD;

if (!employerEmail || !employerPassword) {
  console.error(
    'Missing BENCH_EMPLOYER_EMAIL or BENCH_EMPLOYER_PASSWORD for search benchmark.',
  );
  process.exit(1);
}

const concurrency = Number(process.env.BENCH_CONCURRENCY || 10);
const iterations = Number(process.env.BENCH_ITERATIONS || 5);
const keyword = process.env.BENCH_SEARCH_QUERY || '';
const location = process.env.BENCH_SEARCH_LOCATION || '';
const baseUrl = getBaseUrl();

function buildSearchUrl() {
  const params = new URLSearchParams();
  if (keyword) params.set('query', keyword);
  if (location) params.set('location', location);
  return `${baseUrl}/employers/search?${params.toString()}`;
}

async function main() {
  const cookie = await loginAndGetCookie({
    email: employerEmail,
    password: employerPassword,
  });

  const url = buildSearchUrl();
  const durations = [];
  let failures = 0;

  console.log(`Running employer search benchmark against ${url}`);
  console.log(`Concurrency: ${concurrency}, iterations: ${iterations}`);

  for (let cycle = 0; cycle < iterations; cycle += 1) {
    const batch = Array.from({ length: concurrency }, async () => {
      const startedAt = performance.now();

      try {
        const response = await fetch(url, {
          headers: {
            Cookie: cookie,
          },
        });

        if (!response.ok) {
          failures += 1;
          return;
        }

        await response.text();
        durations.push(performance.now() - startedAt);
      } catch {
        failures += 1;
      }
    });

    await Promise.all(batch);
  }

  summarizeDurations('Employer search benchmark summary', durations, failures);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

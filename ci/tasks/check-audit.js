/* eslint-disable no-console */
/**
 * Runs `npm audit --json` in the current working directory and fails (exit 1)
 * when the per-severity vulnerability counts exceed the configured thresholds.
 *
 * Unlike `npm audit --audit-level`, which is a boolean gate that fails on the
 * presence of any vulnerability at or above a severity, this allows count-based
 * thresholds (e.g. "fail if any critical, or more than 5 high").
 *
 * Thresholds are read from environment variables (any unset severity defaults
 * to 0, meaning "fail on the first one"):
 *   AUDIT_MAX_CRITICAL  (default 0)
 *   AUDIT_MAX_HIGH      (default 0)
 *   AUDIT_MAX_MODERATE  (default Infinity)
 *   AUDIT_MAX_LOW       (default Infinity)
 *   AUDIT_MAX_INFO      (default Infinity)
 *
 * Additional options via environment variables:
 *   AUDIT_OMIT          passed to `npm audit --omit` (default "dev")
 *   AUDIT_DIR           directory to run the audit in (default ".")
 */
const { spawnSync } = require('node:child_process');

const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info'];

const DEFAULT_THRESHOLDS = {
  critical: 0,
  high: 0,
  moderate: Infinity,
  low: Infinity,
  info: Infinity,
};

function parseThreshold(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid audit threshold value: "${value}"`);
  }
  return parsed;
}

function getThresholds(env) {
  return {
    critical: parseThreshold(env.AUDIT_MAX_CRITICAL, DEFAULT_THRESHOLDS.critical),
    high: parseThreshold(env.AUDIT_MAX_HIGH, DEFAULT_THRESHOLDS.high),
    moderate: parseThreshold(env.AUDIT_MAX_MODERATE, DEFAULT_THRESHOLDS.moderate),
    low: parseThreshold(env.AUDIT_MAX_LOW, DEFAULT_THRESHOLDS.low),
    info: parseThreshold(env.AUDIT_MAX_INFO, DEFAULT_THRESHOLDS.info),
  };
}

function runAudit(env) {
  const omit = env.AUDIT_OMIT || 'dev';
  const cwd = env.AUDIT_DIR || '.';
  // `npm` is intentionally resolved from PATH inside the trusted CI node image.
  const result = spawnSync(
    // eslint-disable-next-line sonarjs/no-os-command-from-path
    'npm',
    ['audit', '--json', `--omit=${omit}`],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, cwd },
  );

  // `npm audit` exits non-zero when vulnerabilities are found; that is expected
  // and we still want to parse stdout. Only a missing/garbage payload is fatal.
  if (result.error) {
    throw new Error(`Failed to run npm audit: ${result.error.message}`);
  }

  const stdout = (result.stdout || '').trim();
  if (!stdout) {
    throw new Error(
      `npm audit produced no JSON output.\nstderr:\n${result.stderr || '(empty)'}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (err) {
    throw new Error(
      `Could not parse npm audit JSON output: ${err.message}\noutput:\n${stdout}`,
    );
  }

  const vulnerabilities = parsed?.metadata?.vulnerabilities;
  if (!vulnerabilities) {
    throw new Error(
      'npm audit JSON did not contain metadata.vulnerabilities. ' +
        `Got keys: ${Object.keys(parsed).join(', ')}`,
    );
  }

  return vulnerabilities;
}

function formatThreshold(value) {
  return value === Infinity ? '∞' : String(value);
}

function main() {
  const thresholds = getThresholds(process.env);
  const counts = runAudit(process.env);

  const summary = SEVERITIES.map(
    (sev) => `${sev}=${counts[sev] || 0}/${formatThreshold(thresholds[sev])}`,
  ).join(' ');

  const breaches = SEVERITIES.filter((sev) => (counts[sev] || 0) > thresholds[sev]);

  if (breaches.length > 0) {
    console.error('\n!!! npm audit threshold exceeded !!!');
    console.error(`Vulnerabilities (count/max): ${summary}`);
    breaches.forEach((sev) => {
      console.error(`  ${sev}: ${counts[sev]} > ${formatThreshold(thresholds[sev])}`);
    });
    process.exit(1);
  }

  console.log(`npm audit OK: ${summary}`);
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error('\n!!! ERROR RUNNING AUDIT CHECK !!!');
  console.error(err.message);
  process.exit(1);
}

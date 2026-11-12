// writes one line for a vitest json report into the github job summary.
import { existsSync, readFileSync, appendFileSync } from 'node:fs';

const [reportPath] = process.argv.slice(2);
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!reportPath || !summaryPath) {
  throw new Error(
    'usage: test-summary.mjs <vitest-json-report>, run inside github actions'
  );
}

function resultLine(report) {
  // success also covers files that failed to load, which count no failed test.
  const icon = report.success ? '✅' : '❌';
  const files = report.testResults.length;

  return `${icon} **${report.numPassedTests} of ${report.numTotalTests} tests passed** in ${files} ${files === 1 ? 'file' : 'files'}`;
}

const line = existsSync(reportPath)
  ? resultLine(JSON.parse(readFileSync(reportPath, 'utf8')))
  : '❌ **the tests did not finish**, see the job log';

appendFileSync(summaryPath, `${line}\n`);

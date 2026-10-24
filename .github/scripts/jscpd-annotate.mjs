// Turns jscpd's JSON report into GitHub annotations, then fails like jscpd would.
// Usage: node .github/scripts/jscpd-annotate.mjs [report/jscpd-report.json]
import { readFileSync } from "node:fs";

const path = process.argv[2] || "report/jscpd-report.json";
const report = JSON.parse(readFileSync(path, "utf8"));
const dups = report.duplicates || [];
const esc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
for (const d of dups) {
  const a = d.firstFile;
  const b = d.secondFile;
  const lines = a.end - a.start + 1;
  const msg = `${lines} duplicated lines, also in ${b.name}:${b.start}-${b.end}`;
  console.log(`::warning file=${esc(a.name)},line=${a.start},endLine=${a.end},title=Duplication (jscpd)::${esc(msg)}`);
}
const pct = report.statistics?.total?.percentage ?? 0;
console.log(`jscpd: ${dups.length} clone(s), ${pct}% duplicated`);

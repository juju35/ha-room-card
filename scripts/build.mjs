// Builds src/ into the single HACS file dist/ha-room-card.js, stamping the package version.
// Usage: node scripts/build.mjs  (dist/ is not committed: CI and the release workflow build it)
// shared.js comes first; each card is wrapped in its own block, inside one block for the whole bundle,
// so nothing leaks into the page.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitDist } from "./i18n-split.mjs";

const CARDS = ["room-sensors-card", "room-lights-card", "room-switch-card", "room-environment-card", "room-overview-card"];
const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(`${root}package.json`, "utf8"));
const src = (name) => readFileSync(`${root}src/${name}.js`, "utf8").replaceAll("__VERSION__", pkg.version);

const out = [
  `/*! ha-room-card v${pkg.version} — https://github.com/juju35/ha-room-card */`,
  "{",
  src("shared"),
  ...CARDS.map((c) => `// ── ${c} ──\n{\n${src(c)}}\n`),
  "}",
  "",
].join("\n");

mkdirSync(`${root}dist`, { recursive: true });
writeFileSync(`${root}dist/ha-room-card.js`, out);
console.log(`Built dist/ha-room-card.js (${(out.length / 1024).toFixed(1)} KB, ${CARDS.length} cards)`);

// Translations: English stays in the bundle, each other language goes to dist/ha-room-card.i18n.<lang>.js,
// fetched when a card needs it (scripts/i18n-split.mjs).
if (process.argv[1] === fileURLToPath(import.meta.url)) splitDist(`${root}dist`, "ha-room-card.js", { version: pkg.version });

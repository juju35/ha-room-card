// The build keeps English in the bundle and moves every other language to its own file next to it
// (scripts/i18n-split.mjs, whose self-check fails the build when a table does not rebuild exactly).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const MAIN = "ha-room-card.js";
const STEM = MAIN.replace(/\.js$/, "");
// Built in a copy of the repository, so that tests reading dist/ meanwhile never see a half-written file.
const repo = fileURLToPath(new URL("../", import.meta.url));
const tmp = mkdtempSync(`${tmpdir()}/i18n-split-`);
const skip = new Set(["dist", "node_modules", ".git", "screenshots"]);
for (const f of readdirSync(repo)) if (!skip.has(f)) cpSync(`${repo}${f}`, `${tmp}/${f}`, { recursive: true });
symlinkSync(`${repo}node_modules`, `${tmp}/node_modules`);
// Run through a symlink, as on macOS where os.tmpdir() (/var/folders) is a link to /private/var/folders: the build
// must still see that it is the main module and split the translations.
const link = `${tmp}-link`;
symlinkSync(tmp, link);
after(() => rmSync(tmp, { recursive: true, force: true }));
after(() => rmSync(link, { force: true }));
execFileSync(process.execPath, [`${link}/scripts/build.mjs`], { stdio: "pipe" });
const dist = (f) => pathToFileURL(`${tmp}/dist/${f}`);
const bundle = readFileSync(dist(MAIN), "utf8");
const langs = JSON.parse(bundle.match(/const LANGS = new Set\((\[[^\]]*\])\)/)[1]);
const files = readdirSync(`${tmp}/dist`).filter((f) => f.startsWith(`${STEM}.i18n.`));

test("every language but English has its own file next to the bundle", () => {
  assert.ok(langs.length >= 4 && !langs.includes("en"), `languages: ${langs}`);
  assert.deepEqual(files.sort(), langs.map((l) => `${STEM}.i18n.${l}.js`).sort());
});

test("a language file is a module of plain data, left out of the bundle", async () => {
  for (const f of files) {
    const mod = await import(dist(f).href);
    const tables = Object.values(mod.default);
    assert.ok(tables.length && tables.every((t) => t && typeof t === "object"), f);
  }
  // The longest French text is not in the bundle any more.
  const fr = await import(dist(`${STEM}.i18n.fr.js`).href);
  const texts = Object.values(fr.default).flatMap((t) =>
    Object.values(t).filter((v) => typeof v === "string" && !/["'`\\\n{]/.test(v)),
  );
  const longest = texts.sort((a, b) => b.length - a.length)[0];
  assert.ok(longest && !bundle.includes(longest), longest);
});

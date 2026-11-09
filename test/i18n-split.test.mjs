// The build keeps English in the bundle and moves every other language to its own file next to it
// (scripts/i18n-split.mjs, whose self-check fails the build when a table does not rebuild exactly).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const MAIN = "ha-room-card.js";
const STEM = MAIN.replace(/\.js$/, "");
const root = new URL("../", import.meta.url);
const dist = (f) => new URL(`dist/${f}`, root);

execFileSync(process.execPath, [new URL("scripts/build.mjs", root).pathname], { stdio: "pipe" });
const bundle = readFileSync(dist(MAIN), "utf8");
const langs = JSON.parse(bundle.match(/const LANGS = new Set\((\[[^\]]*\])\)/)[1]);
const files = readdirSync(new URL("dist/", root)).filter((f) => f.startsWith(`${STEM}.i18n.`));

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

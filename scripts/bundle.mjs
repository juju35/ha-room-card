// Assembles the card's ES modules (src/) back into the single classic script the card ships as: the modules listed by
// the entry file, in that order, with their import lines removed and their `export ` keywords dropped. They come from
// one script and share its names, so nothing else changes: comments, placeholders (__VERSION__, …) and the order of
// the code stay as written. A translation table (one file per language in an i18n/ folder, gathered by a table file)
// is rebuilt into a single object literal, the table scripts/i18n-split.mjs splits per language.
// No dependency; the result is parsed as a classic script (no import/export may be left).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";

const root = fileURLToPath(new URL("..", import.meta.url));
const IMPORT = /^import (?:\{[^}]*\}|\w+) from "(\.{1,2}\/[^"]+)";\n/gm;
const SIDE = /^import "(\.{1,2}\/[^"]+)";$/gm;

// A table file: imports one file per language, then for each table `export const NAME = {`, one line per language
// (`  lang,` / `  "lang": id,` when the language file is that table, `  lang: id.NAME,` when it holds several), `};`.
const table = (path, code) => {
  const blocks = [...code.matchAll(/^export (const|let|var) (\w+) = \{\n([\s\S]*?)\n\};$/gm)];
  if (!blocks.length) return null;
  const files = new Map([...code.matchAll(/^import (\w+) from "(\.\/[\w./-]+\.js)";$/gm)].map((x) => [x[1], x[2]]));
  const fileOf = (id) => {
    const file = files.get(id);
    if (!file) throw new Error(`${path}: no import for ${id}`);
    return readFileSync(join(dirname(path), file), "utf8");
  };
  const literal = (id, member) => {
    const text = fileOf(id);
    if (!member) {
      const body = text.match(/^export default (\{[\s\S]*\});\s*$/m);
      if (!body) throw new Error(`${files.get(id)}: expected "export default { … };"`);
      return body[1].replace(/\n/g, "\n  ");
    }
    const ast = parse(text, { ecmaVersion: "latest", sourceType: "module" });
    const obj = ast.body.find((n) => n.type === "ExportDefaultDeclaration")?.declaration;
    const prop = obj?.properties?.find((p) => (p.key.name ?? p.key.value) === member);
    if (!prop) throw new Error(`${files.get(id)}: no ${member}`);
    return text.slice(prop.value.start, prop.value.end);
  };
  let out = code.replace(IMPORT, "").replace(/^\/\/ One file per language;[^\n]*\n\/\/ [^\n]*\n/m, "").replace(/^\n+/, "");
  for (const m of blocks) {
    const entries = m[3].split("\n").map((line) => {
      const e = line.match(/^ {2}(?:"([\w-]+)"|([\w]+))(?:: (\w+)(?:\.(\w+))?)?,$/);
      if (!e) throw new Error(`${path}: unexpected line ${line}`);
      const key = e[1] || e[2];
      return `  ${e[1] ? JSON.stringify(key) : key}: ${literal(e[3] || key, e[4])},`;
    });
    out = out.replace(m[0], `${m[1]} ${m[2]} = {\n${entries.join("\n")}\n};`);
  }
  return out;
};

const moduleCode = (path) => {
  const code = readFileSync(path, "utf8");
  if (/[\\/]i18n[\\/]/.test(path)) {
    const t = table(path, code);
    if (t) return t;
  }
  // remove the import statements and the `export ` keywords, wherever they are on their line
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const edits = [];
  for (const n of ast.body) {
    if (n.type === "ImportDeclaration") edits.push([n.start, code[n.end] === "\n" ? n.end + 1 : n.end]);
    else if (n.type === "ExportNamedDeclaration" && n.declaration) edits.push([n.start, n.declaration.start]);
    else if (/^Export/.test(n.type)) throw new Error(`${path}: unsupported ${n.type}`);
  }
  let out = code;
  for (const [a, b] of edits.reverse()) out = out.slice(0, a) + out.slice(b);
  return out.replace(/^\n+/, "");
};

export const bundle = (entry = "src/index.js") => {
  const path = `${root}${entry}`;
  const parts = [...readFileSync(path, "utf8").matchAll(SIDE)].map((m) => moduleCode(join(dirname(path), m[1])));
  const code = `${parts.map((p) => p.replace(/\n+$/, "")).join("\n\n")}\n`;
  // no import/export statement may be left (a card may use import.meta, so it is parsed as a module)
  const ast = parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const left = ast.body.find((n) => /^(Import|Export)/.test(n.type));
  if (left) throw new Error(`${entry}: ${left.type} left in the bundle at ${code.slice(0, left.start).split("\n").length}`);
  return code;
};

// The source of src/<name>.js, or of src/<name>/ once split into modules (entry src/<name>/index.js).
export const sourceOf = (name) => (existsSync(`${root}src/${name}/index.js`) ? bundle(`src/${name}/index.js`) : readFileSync(`${root}src/${name}.js`, "utf8"));

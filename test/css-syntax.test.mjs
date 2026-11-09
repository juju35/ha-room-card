// The cards' CSS, written in JavaScript strings, read back with a CSS parser: a broken rule (a dangling line, a
// missing brace) is silently dropped by the browser, with the rule after it.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import * as acorn from "acorn";
import * as csstree from "css-tree";

const SRC = new URL("../src/", import.meta.url);
const files = readdirSync(SRC)
  .filter((f) => f.endsWith(".js"))
  .map((f) => new URL(f, SRC));

// A string, a template literal or a concatenation of them, with every other part (a variable, a call) as a
// placeholder that parses anywhere CSS takes a word.
function flatten(node) {
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? "x0" : "")).join("");
  }
  if (node.type === "BinaryExpression" && node.operator === "+") return flatten(node.left) + flatten(node.right);
  return "x0";
}

// Texts that are a style sheet: at least two rules `selector { property: value }`.
const looksLikeCss = (text) => (text.match(/[^{};]+\{[^{}]*:[^{}]*\}/g) || []).length >= 2;

// The CSS of a text: what is between <style> tags when it is HTML, else all of it. A placeholder standing for a
// whole declaration or rule (a part built elsewhere) is dropped; legacy IE filters (a vendored library) too.
function cssOf(text) {
  const bare = text.replace(/\/\*[\s\S]*?\*\//g, "");
  const styles = [...bare.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  // A piece added to a <style> built elsewhere: `.replace('</style>', '… </style>')`
  const piece = !styles.length && /^[^<]*<\/style>\s*$/.test(bare) ? [bare.replace(/<\/style>\s*$/, "")] : [];
  const css = styles.length ? styles.join("\n") : piece.length ? piece[0] : /<\/?[a-z][\w-]*[\s>]/i.test(bare) ? "" : bare;
  return css
    .replace(/(^|[{};])(\s*)x0(?=\s*(?:$|[}<]|--?[a-zA-Z][\w-]*\s*:))/g, "$1$2")
    .replace(/filter:\s*progid:[^;]*;/g, "");
}

function sheets(source) {
  const out = [];
  const ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "module", locations: true });
  const walk = (node, parentIsConcat) => {
    if (!node || typeof node.type !== "string") return;
    const concat = node.type === "BinaryExpression" && node.operator === "+";
    if (!parentIsConcat && (concat || node.type === "TemplateLiteral" || (node.type === "Literal" && typeof node.value === "string"))) {
      const text = flatten(node);
      const css = cssOf(text);
      if (looksLikeCss(css)) out.push({ text: css, line: node.loc.start.line });
    }
    for (const key of Object.keys(node)) {
      if (key === "loc") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) walk(c, false);
      } else if (child && typeof child.type === "string") walk(child, concat);
    }
  };
  walk(ast, false);
  return out;
}

test("every style sheet of the cards parses without error", () => {
  // A dangling declaration line before a rule (seen in ha-docker-card) fails here with its file, line and text.
  const errors = [];
  let count = 0;
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const { text, line } of sheets(source)) {
      count++;
      csstree.parse(text, {
        onParseError: (err) => errors.push(`${String(file).split("/").pop()}:${line} ${err.message} near "${text.slice(Math.max(0, err.offset - 40), err.offset + 40).replace(/\s+/g, " ")}"`),
      });
    }
  }
  assert.ok(count > 0, "no style sheet found");
  assert.deepEqual(errors, []);
});

// Splits the translations out of a built card bundle: only English stays inline, every other language goes to
// its own small file next to the bundle (`<stem>.i18n.<lang>.js`), fetched when a card first needs it.
// Home Assistant loads every dashboard resource on every dashboard, so a bundle carrying all its languages
// made each page download and parse them all to use one.
//
// It works on the built code; src/ keeps every language, so editing and testing translations is unchanged:
// - a translation table is an object literal with an `en` key and at least four other language keys;
// - each non-English value is cut out to the language's file and replaced by `{}`, so the language still exists
//   (`lang in TABLE`, `Object.keys(TABLE)` and the cards' language resolution are unchanged) and falls back to
//   English, key by key, until its file has loaded;
// - a language that starts by spreading the same language of another split table (`de: { ...BASE.de, … }`)
//   is rebuilt the same way once loaded;
// - the table is wrapped in `<ns>.register(<n>, …)`, which registers it and returns a proxy: the first read of
//   a language that is not loaded yet fetches its file, fills the table in place and redraws this bundle's
//   cards (setConfig with their current config). The page's language is fetched as soon as the bundle runs.
// A table whose translations hold code (a function, a variable) or are not dictionaries stays whole in the bundle.
// The bundle stays a classic script (no import.meta, no top-level await): it also runs injected as content.
// After splitting, every table is rebuilt from the bundle and the language files and compared with the
// original: the build fails on any difference.
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { parse } from "acorn";

const LANGS = new Set(["en", "fr", "de", "es", "sr", "sr-Latn", "it", "nl", "pt", "pl", "ro", "da", "sv", "bg", "ru", "uk", "hu", "sk", "cs", "sl", "lv", "el"]);
const keyName = (p) => (p.type === "Property" && !p.computed ? (p.key.name ?? p.key.value) : undefined);
const parseScript = (code) => parse(code, { ecmaVersion: "latest", sourceType: "script" });

// Pure data: literals, template literals without expressions, arrays and objects of those.
const isData = (n) => {
  switch (n.type) {
    case "Literal":
      return true;
    case "TemplateLiteral":
      return n.expressions.length === 0;
    case "ArrayExpression":
      return n.elements.every((e) => e && isData(e));
    case "ObjectExpression":
      return n.properties.every((p) => p.type === "Property" && !p.computed && p.kind === "init" && !p.method && isData(p.value));
    case "UnaryExpression":
      return n.operator === "-" && n.argument.type === "Literal";
    default:
      return false;
  }
};

// A language value: { spreads: [table names], own: [properties] }, or null when it is not data.
// Spreads must come first and read the same language of a named table (`...BASE.de`).
const analyse = (value, lang) => {
  // Only dictionaries are split: a string or a list per language (language names, compass points) stays inline.
  if (value.type !== "ObjectExpression") return null;
  const spreads = [];
  const own = [];
  for (const p of value.properties) {
    if (p.type === "SpreadElement") {
      const a = p.argument;
      const ok =
        !own.length &&
        a.type === "MemberExpression" &&
        a.object.type === "Identifier" &&
        ((!a.computed && a.property.name === lang) || (a.computed && a.property.type === "Literal" && a.property.value === lang));
      if (!ok) return null;
      spreads.push(a.object.name);
    } else if (p.type === "Property" && !p.computed && p.kind === "init" && !p.method && isData(p.value)) own.push(p);
    else return null;
  }
  return { spreads, own };
};

const findTables = (ast) => {
  const tables = [];
  const visit = (n, name) => {
    if (!n || typeof n.type !== "string") return;
    if (n.type === "ObjectExpression") {
      const props = n.properties.filter((p) => LANGS.has(keyName(p)));
      if (props.some((p) => keyName(p) === "en") && props.length >= 5) {
        tables.push({ node: n, name, langs: props.filter((p) => keyName(p) !== "en") });
        return;
      }
    }
    for (const k of Object.keys(n)) {
      const v = n[k];
      const childName = n.type === "VariableDeclarator" && k === "init" && n.id.type === "Identifier" ? n.id.name : undefined;
      if (Array.isArray(v)) {
        for (const c of v) visit(c, undefined);
      }
      else if (v && typeof v.type === "string") visit(v, childName);
    }
  };
  visit(ast);
  return tables;
};

// Which tables can be split: every language is data, or spreads of split tables plus data (fixed point).
const plan = (tables) => {
  const byName = new Map(tables.filter((t) => t.name).map((t) => [t.name, t]));
  for (const t of tables) t.parts = t.langs.map((p) => analyse(p.value, keyName(p)));
  let split = new Set(tables.filter((t) => t.parts.every(Boolean)));
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of split) {
      const ok = t.parts.every((part) => part.spreads.every((s) => byName.has(s) && split.has(byName.get(s))));
      if (!ok) {
        split.delete(t);
        changed = true;
      }
    }
  }
  split = tables.filter((t) => split.has(t));
  split.forEach((t, i) => {
    t.id = i;
  });
  return { split, byName };
};

const prelude = ({ ns, stem, version, langs, spreads, names }) => `// ── Translations loaded on demand (scripts/i18n-split.mjs) ──
// English is inline; every other language is in ${stem}.i18n.<lang>.js next to this file, fetched when needed.
var ${ns} = (() => {
  const LANGS = new Set(${JSON.stringify(langs)});
  const SPREADS = ${JSON.stringify(spreads)};
  const tables = [];
  const data = {};
  const loads = {};
  const tags = new Set();
  let base;
  const baseUrl = () => {
    if (base !== undefined) return base;
    base = null;
    const re = /\\/(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\\\$&")).join("|")})\\.js(\\?|$)/;
    try {
      const src = document.currentScript?.src;
      if (src && re.test(src)) base = src;
      const entries = base ? [] : performance.getEntriesByType("resource");
      for (let i = entries.length - 1; i >= 0 && !base; i--) if (re.test(entries[i].name)) base = entries[i].name;
      if (!base) for (const s of document.querySelectorAll("script[src]")) if (re.test(s.src)) base = s.src;
    } catch (_err) {
      /* no DOM */
    }
    return base;
  };
  const resolved = (lang, n) => Object.assign({}, ...(SPREADS[n] || []).map((m) => resolved(lang, m)), data[lang][n]);
  const fill = (lang, n) => {
    const t = tables[n];
    if (t && t[lang] && data[lang]?.[n]) Object.assign(t[lang], resolved(lang, n));
  };
  const refresh = () => {
    if (typeof document === "undefined") return;
    const stack = [document.documentElement];
    while (stack.length) {
      const el = stack.pop();
      if (!el) continue;
      if (tags.has(el.localName) && el._config && typeof el.setConfig === "function") {
        try {
          el.setConfig(el._config);
        } catch (_err) {
          /* the card shows its own error */
        }
      }
      if (el.shadowRoot) stack.push(...el.shadowRoot.children);
      stack.push(...el.children);
    }
  };
  const load = (lang) => {
    if (!LANGS.has(lang) || loads[lang]) return loads[lang];
    const url = baseUrl();
    if (!url) return (loads[lang] = Promise.resolve());
    const file = new URL(\`${stem}.i18n.\${lang}.js?v=${version}\`, url).href;
    loads[lang] = import(file).then(
      (m) => {
        data[lang] = m.default;
        for (const n of Object.keys(m.default)) fill(lang, n);
        refresh();
      },
      (err) => console.warn(\`${stem}: "\${lang}" translations not loaded (\${err?.message ?? err}), English shown\`),
    );
    return loads[lang];
  };
  const register = (n, table) => {
    tables[n] = table;
    for (const lang of Object.keys(data)) fill(lang, n);
    return new Proxy(table, {
      get(t, k) {
        if (typeof k === "string" && k !== "en" && LANGS.has(k) && !data[k]) load(k);
        return t[k];
      },
    });
  };
  // Records this bundle's element names, to redraw its cards once a language has loaded.
  const ce = globalThis.customElements;
  const customElements =
    ce &&
    new Proxy(ce, {
      get(t, k) {
        if (k === "define") return (tag, cls, opts) => (tags.add(tag), t.define(tag, cls, opts));
        const v = t[k];
        return typeof v === "function" ? v.bind(t) : v;
      },
    });
  try {
    const page = document.documentElement.lang || "";
    load(LANGS.has(page) ? page : page.split("-")[0]);
  } catch (_err) {
    /* no DOM */
  }
  return { register, load, customElements };
})();
`;

const ownText = (code, part) => `{ ${part.own.map((p) => code.slice(p.start, p.end)).join(", ")} }`;

/**
 * Splits `code` (a built bundle). Writes `<outDir>/<stem>.i18n.<lang>.js` and returns the new bundle code
 * with `{ code, langs, tables, kept }`. Throws when a split table does not rebuild to the original one.
 */
export function splitI18n(code, { stem, version, outDir, aliases = [] }) {
  // One global name per bundle: a bundle injected as a classic script shares the page's global scope.
  const ns = `__i18n_${stem.replace(/[^\w$]/g, "_")}`;
  const tables = findTables(parseScript(code));
  const { split, byName } = plan(tables);
  if (!split.length) return { code, langs: [], tables: 0, kept: tables.length };
  const edits = [];
  const files = {};
  const spreads = {};
  for (const t of split) {
    edits.push({ start: t.node.start, end: t.node.start, text: `${ns}.register(${t.id}, ` });
    t.langs.forEach((p, i) => {
      const lang = keyName(p);
      const part = t.parts[i];
      if (part.spreads.length) spreads[t.id] = part.spreads.map((s) => byName.get(s).id);
      (files[lang] ||= []).push(`${JSON.stringify(String(t.id))}: ${ownText(code, part)}`);
      edits.push({ start: p.value.start, end: p.value.end, text: "{}" });
    });
    edits.push({ start: t.node.end, end: t.node.end, text: ")" });
  }
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = code;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  const langs = Object.keys(files).sort();
  // The bundle's customElements.define calls go through the proxy that records the element names.
  out = out.replace(/(^|[^.\w$])customElements\.define\(/g, `$1${ns}.customElements.define(`);
  const header = out.match(/^\/\*![\s\S]*?\*\/\n/)?.[0] ?? "";
  out = header + prelude({ ns, stem, version, langs, spreads, names: [stem, ...aliases] }) + out.slice(header.length);
  for (const lang of langs) {
    const body = `// ${stem} ${version}: "${lang}" translations, loaded by ${stem}.js when needed.\nexport default {\n${files[lang].join(",\n")}\n};\n`;
    writeFileSync(`${outDir}/${stem}.i18n.${lang}.js`, body);
  }
  selfCheck({ code, out, split, byName, spreads, langs, outDir, stem, ns });
  return { code: out, langs, tables: split.length, kept: tables.length - split.length };
}

// Rebuilds every split table from the new bundle and the language files, and compares it with the original.
function selfCheck({ code, out, split, byName, spreads, langs, outDir, stem, ns }) {
  const evalWith = (src, scope) => Function(...Object.keys(scope), `"use strict"; return (${src});`)(...Object.values(scope));
  // Original tables, evaluated with the tables they spread from.
  const orig = new Map();
  const evalOrig = (t) => {
    if (orig.has(t)) return orig.get(t);
    const scope = {};
    const refs = [...code.slice(t.node.start, t.node.end).matchAll(/\.\.\.([A-Za-z_$][\w$]*)\./g)].map((m) => m[1]);
    for (const s of new Set(refs)) if (byName.has(s)) scope[s] = evalOrig(byName.get(s));
    const v = evalWith(code.slice(t.node.start, t.node.end), scope);
    orig.set(t, v);
    return v;
  };
  const data = Object.fromEntries(
    langs.map((l) => {
      const text = readFileSync(`${outDir}/${stem}.i18n.${l}.js`, "utf8").replace(/^\/\/.*\n/, "").replace(/^export default /, "");
      return [l, evalWith(text.replace(/;\s*$/, ""), {})];
    }),
  );
  const resolved = (lang, n) => Object.assign({}, ...(spreads[n] || []).map((m) => resolved(lang, m)), data[lang][n]);
  const re = new RegExp(`${ns}\\.register\\((\\d+), `, "g");
  const starts = [...out.matchAll(re)];
  if (starts.length !== split.length) throw new Error(`i18n split: ${split.length} tables, ${starts.length} registered`);
  const ast = parseScript(out);
  const wrapped = [];
  const visit = (n) => {
    if (!n || typeof n.type !== "string") return;
    if (n.type === "CallExpression" && n.callee.type === "MemberExpression" && n.callee.object.name === ns && n.callee.property.name === "register") {
      wrapped[n.arguments[0].value] = n.arguments[1];
    }
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v.type === "string") visit(v);
    }
  };
  visit(ast);
  // English may spread other tables' English: bind every named split table to its original value.
  const names = Object.fromEntries(split.filter((t) => t.name).map((t) => [t.name, evalOrig(t)]));
  for (const t of split) {
    const rebuilt = evalWith(out.slice(wrapped[t.id].start, wrapped[t.id].end), names);
    for (const l of Object.keys(rebuilt)) if (l !== "en" && data[l]?.[t.id]) Object.assign(rebuilt[l], resolved(l, t.id));
    if (JSON.stringify(evalOrig(t)) !== JSON.stringify(rebuilt)) throw new Error(`i18n split: table ${t.id} (${t.name ?? "unnamed"}) does not rebuild`);
  }
}

/**
 * Splits the built `dist/<main>.js` in place, removing language files of an earlier build first. Each alias
 * (a legacy file name shipping the same bundle) gets the split bundle too, and finds the language files the same way.
 */
export function splitDist(distDir, main, { version, aliases = [] }) {
  for (const f of readdirSync(distDir)) if (/\.i18n\.[\w-]+\.js$/.test(f)) rmSync(`${distDir}/${f}`);
  const stem = main.replace(/\.js$/, "");
  const code = readFileSync(`${distDir}/${main}`, "utf8");
  const sameAliases = aliases.filter((a) => readFileSync(`${distDir}/${a}`, "utf8") === code);
  const r = splitI18n(code, { stem, version, outDir: distDir, aliases: sameAliases.map((a) => a.replace(/\.js$/, "")) });
  writeFileSync(`${distDir}/${main}`, r.code);
  for (const a of sameAliases) writeFileSync(`${distDir}/${a}`, r.code);
  const kb = (s) => `${(s.length / 1024).toFixed(1)} KB`;
  console.log(`Translations: ${r.tables} tables split into ${r.langs.length} language files, ${main} ${kb(code)} → ${kb(r.code)}`);
  return r;
}

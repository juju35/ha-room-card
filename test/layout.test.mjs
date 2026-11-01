// Narrow headers: the CSS rules that keep the title readable and every button inside the card at the cards' smallest
// widths (6 columns of the Sections view for every card, mini cards included). There is no
// browser in the test run: the rules are checked here, the rendering itself in Chromium (see the pull request).
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const rc = load();
const { cards } = rc;

// Declarations of the first rule whose selector list is exactly `selector`, in `css` (or in a block of it).
const decls = (css, selector) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = css.match(new RegExp(`(?:^|[{}]|\\*/)\\s*${esc}\\s*\\{([^}]*)\\}`));
  assert.ok(m, `no rule for ${selector}`);
  return Object.fromEntries(
    m[1]
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => [d.slice(0, d.indexOf(":")).trim(), d.slice(d.indexOf(":") + 1).trim()]),
  );
};

// A shadow root whose nodes are handed out by selector (the overview looks its parts up once drawn).
const overviewWith = (config, hass) => {
  const overview = new cards["room-overview-card"]();
  overview.attachShadow();
  const nodes = {};
  const node = () => ({ ...fakeNode(), style: { setProperty() {} }, querySelector: (s) => (nodes[s] ||= node()) });
  overview.shadowRoot.querySelector = (s) => (s === "ha-card" && !overview.shadowRoot.innerHTML ? null : (nodes[s] ||= node()));
  overview.setConfig(config);
  overview.hass = hass;
  return nodes[".head"].innerHTML;
};

// Body of the `@container (max-width: <px>px)` block of `css` holding `needle`.
const container = (css, px, needle) => {
  let from = 0;
  for (;;) {
    const at = css.indexOf(`@container (max-width: ${px}px)`, from);
    assert.ok(at >= 0, `no @container (max-width: ${px}px) block with ${needle}`);
    let depth = 0;
    let i = css.indexOf("{", at);
    const start = i + 1;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    const body = css.slice(start, i);
    if (body.includes(needle)) return body;
    from = i;
  }
};

const BASE = rc.RC_BASE_STYLES;
const styles = (tag) => `${BASE}${cards[tag].styles}`;

// The title takes what the status pill leaves (flex-basis 0), never under 4 letters: with `flex: 1 1 auto` a long
// title took its share of the shrinking from the pill too, "Ready" ending "Re…" on a 320 px card.
test("Header: the status pill keeps its whole label, the title takes what is left (never under 4 letters)", () => {
  const title = decls(BASE, ".title");
  assert.equal(title.flex, "1 1 0");
  const [, ch] = title["min-width"].match(/^(\d+(?:\.\d+)?)ch$/) || [];
  assert.ok(Number(ch) >= 4, "the title never falls under 4 letters");
  assert.equal(title["text-overflow"], "ellipsis");
  const pill = decls(BASE, ".pill");
  assert.equal(pill.flex, "0 1 auto");
  assert.equal(pill["min-width"], "0");
  assert.equal(pill["max-width"], undefined, "cut only when the room is really missing, not past half the header");
  const text = decls(BASE, ".pt");
  assert.equal(text["text-overflow"], "ellipsis");
  assert.equal(text.overflow, "hidden");
  assert.equal(decls(BASE, "ha-card")["container-type"], "inline-size", "the cards answer their own width");
});

test("Header: under 200 px the status is only its coloured dot, its text kept for screen readers", () => {
  const narrow = container(BASE, 200, ".pill");
  assert.match(narrow, /\.head > \.pill \.pt, \.st \.pt \{[^}]*clip-path: inset\(50%\)/);
  assert.match(narrow, /\.head > \.pill:not\(\.action\)::before, \.st::before \{[^}]*border-radius: 50%[^}]*background: var\(--c\)/);
  // Only the header's pill: the mini cards' chips are ".r.pill" too, and must keep their name.
  for (const sel of narrow.split("}").flatMap((r) => r.split("{")[0].split(",")).map((x) => x.trim())) {
    if (sel.includes(".pill")) assert.ok(sel.startsWith(".head > .pill"), `${sel} would hit the mini chips`);
  }
  for (const tag of ["room-lights-card", "room-sensors-mini-card"]) {
    const card = new cards[tag]();
    card.setConfig({ area: "kitchen" });
    card.hass = makeHass();
    const html = card.shadowRoot.innerHTML;
    assert.match(html, /class="(pill|st)[^"]*" title="[^"]+"/, `${tag}: the status in the title`);
    assert.match(html, /<span class="pt">[^<]+<\/span>/, `${tag}: the status text in its own span`);
  }
});

test("Icon buttons never shrink", () => {
  assert.equal(decls(styles("room-overview-card"), ".zoom").flex, "none");
  assert.equal(decls(BASE, ".pill ha-icon").flex, "none");
});

test("Mini cards: the status ellipsises instead of pushing out the title and the zoom button", () => {
  const css = styles("room-sensors-mini-card");
  const st = decls(css, ".st");
  assert.equal(st.flex, "0 1 auto");
  assert.equal(st["min-width"], "0");
  assert.equal(st["max-width"], undefined);
  assert.equal(decls(css, ".mini .title").flex, undefined, "the mini title keeps the shared flex: 1 1 0");
});

test("Mini cards: a chip with a long name ends with an ellipsis inside the card", () => {
  const css = styles("room-sensors-mini-card");
  const r = decls(css, ".r");
  assert.equal(r["max-width"], "100%");
  assert.equal(r.overflow, "hidden");
  assert.equal(r["min-width"], "0");
  assert.equal(decls(css, ".r > span")["text-overflow"], "ellipsis");
  // The open sensor's name is in that span.
  const h = makeHass();
  h.states["binary_sensor.door"].state = "on";
  const card = new cards["room-sensors-mini-card"]();
  card.setConfig({ area: "kitchen" });
  card.hass = h;
  assert.match(card.shadowRoot.innerHTML, /<button class="r on pill[^>]*>\s*<ha-icon[^>]*><\/ha-icon><span>Door<\/span>/);
});

test("Overview: on a narrow card the header chips go to a line of their own", () => {
  const css = styles("room-overview-card");
  // Up to 420 px: just above 340 px (a phone in masonry, 367-410 px) the chips stayed beside the title and the
  // status pill took all the shrinking ("Water leak" down to "…").
  const narrow = container(css, 420, ".hchips");
  assert.match(narrow, /\.head \{[^}]*flex-wrap: wrap/);
  assert.match(narrow, /\.hchips \{[^}]*flex: 1 0 100%/);
  assert.equal(decls(css, ".hchips").flex, "none");

  const head = overviewWith({ plugs_off_button: true }, makeHass());
  assert.match(head, /<div class="hchips"><button class="chip light action"[\s\S]*<button class="chip plug action"[\s\S]*<\/div>\s*<div class="pill"/);
  assert.match(head, /<div class="pill" title="[^"]+"><span class="pt">/);
});

test("Overview with nothing on: no empty chips group", () => {
  const h = makeHass();
  h.states["light.ceiling"].state = "off";
  h.states["switch.coffee_plug"].state = "off";
  assert.doesNotMatch(overviewWith({}, h), /hchips/);
});

test("Environment card under 200 px: the tile icon gives its room to the reading", () => {
  const narrow = container(styles("room-environment-card"), 200, ".ic");
  assert.match(narrow, /\.tile \.ic \{ display: none; \}/);
  assert.match(narrow, /\.gauge \{ left: 8px; \}/);
});

// Phone width: 6 columns of the Sections view are ~156-178 px, a masonry phone card ~300-370 px.
test("Tiles: a reading is never cut, it wraps; one tile per row on a card under 260 px", () => {
  const state = decls(BASE, ".state");
  assert.equal(state["text-overflow"], undefined, "no ellipsis on the reading");
  assert.notEqual(state["white-space"], "nowrap");
  assert.equal(state["overflow-wrap"], "break-word");
  assert.equal(decls(BASE, ".name")["text-overflow"], "ellipsis", "the name, a label, keeps its ellipsis");
  assert.match(container(BASE, 260, ".grid"), /\.grid \{ grid-template-columns: minmax\(0, 1fr\); \}/);
});

test("Mini cards: 6 columns at least (at 4, ~104-121 px on a phone, the zoom button left the card)", () => {
  for (const tag of ["room-sensors-mini-card", "room-environment-mini-card"]) {
    assert.equal(new cards[tag]().getGridOptions().min_columns, 6, tag);
  }
});

// layout-card, button-card, a grid's `auto` column: the container query's inline-size containment drops the content
// from the card's natural width, which fell to its padding (~26 px).
test("Cards keep a natural width in a wrapper sized by its content", () => {
  const card = decls(BASE, "ha-card");
  assert.equal(card["container-type"], "inline-size");
  assert.match(card["contain-intrinsic-inline-size"] || "", /^\d+px$/);
  assert.ok(Number.parseInt(card["contain-intrinsic-inline-size"], 10) >= 280);
});

// That natural width is also the card's min-content width: in a grid's 1fr columns (grid card, layout-card) or a
// horizontal stack, two cards at 320-500 px overflowed by up to 380 px until the host was allowed to shrink.
test("Cards shrink in a 1fr column or a horizontal stack: the host's min-width is 0, never a px width", () => {
  const host = decls(BASE.replace(/\/\*[\s\S]*?\*\//g, ""), ":host");
  assert.equal(host["min-width"], "0");
  for (const [tag, card] of Object.entries(cards)) {
    assert.doesNotMatch(`${BASE}${card.styles || ""}`, /:host\s*\{[^}]*min-width:\s*\d+px/, tag);
  }
});

// At 6 columns on a phone (~234-245 px) the title is at its few letters already: "Włączone: 4 · 1.3 kW",
// "Do sprawdzenia: 1" or "Otwarte: 2" ended with "…". The pill goes to a line of its own, under the title.
test("Header under 260 px: the status pill goes to a line of its own instead of being cut", () => {
  const narrow = container(BASE, 260, ".head::after");
  assert.match(narrow, /\.head \{[^}]*flex-wrap: wrap/);
  assert.match(narrow, /\.head::after \{[^}]*flex: 1 0 100%/);
  assert.match(narrow, /\.head > \.pill \{[^}]*order: 2/);
  // Under 200 px it is only its dot again, back on the title's line.
  const dot = container(BASE, 200, ".head::after");
  assert.match(dot, /\.head::after \{ content: none; \}/);
  // The overview keeps its pill on the first line: its chips have the second one.
  assert.match(container(cards["room-overview-card"].styles, 260, ".head::after"), /\.head > \.pill \{ order: 0;/);
});

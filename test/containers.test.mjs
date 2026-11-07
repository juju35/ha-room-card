// Every card in parents outside the native views (layout-card, button-card, a grid card or a horizontal stack): it
// neither falls to its borders where it is sized by its content (inline-block, a grid's `auto` column) nor refuses
// to shrink below its natural width in a `1fr 1fr` grid, placed directly or wrapped in a <div> (hui-card in
// layout-card). Rendered in Chromium when Playwright and its browser are installed (`npx playwright install
// chromium`); skipped otherwise (the CSS rules themselves are checked in layout.test.mjs).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";

// The bundle, put together like scripts/build.mjs does.
const CARDS = ["room-sensors-card", "room-lights-card", "room-switch-card", "room-environment-card", "room-overview-card"];
const read = (name) => readFileSync(new URL(`../src/${name}.js`, import.meta.url), "utf8");
const source = ["{", read("shared"), ...CARDS.map((c) => `{\n${read(c)}}\n`), "}"].join("\n");

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {}
const browser = await chromium?.launch().catch(() => null);

const HA = `customElements.define("ha-card", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:block;border:1px solid #ddd;overflow:hidden}</style><slot></slot>"; } });
customElements.define("ha-icon", class extends HTMLElement { constructor() { super();
  this.attachShadow({ mode: "open" }).innerHTML = "<style>:host{display:inline-flex;width:24px;height:24px}</style>"; } });`;

// [name, total width, parent style, cards in the parent]
const CONTEXTS = [];
for (const w of [320, 600]) {
  CONTEXTS.push([`inline-block ${w}`, w, "display:inline-block", 1]);
  CONTEXTS.push([`grid auto ${w}`, w, "display:grid;grid-template-columns:auto;justify-content:start", 1]);
}
for (const w of [320, 360, 500]) CONTEXTS.push([`grid 1fr 1fr ${w}`, w, "display:grid;grid-template-columns:1fr 1fr;gap:8px", 2]);

const st = (entity_id, state, attributes) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });
// Serialisable (handed to the page): the page adds callService itself.
const { callService: _, ...base } = makeHass();
const hass = {
  ...base,
  language: "en",
  locale: { language: "en" },
  entities: { ...base.entities, "sensor.kitchen_temperature": { area_id: "kitchen" } },
  states: {
    ...base.states,
    "sensor.kitchen_temperature": st("sensor.kitchen_temperature", "21.4", { device_class: "temperature", unit_of_measurement: "°C" }),
  },
};
const TAGS = [
  "room-sensors-card",
  "room-sensors-mini-card",
  "room-lights-card",
  "room-lights-mini-card",
  "room-switch-card",
  "room-switch-mini-card",
  "room-environment-card",
  "room-environment-mini-card",
  "room-environment-overview-card",
  "room-overview-card",
];

for (const tag of TAGS) {
  test(`${tag} keeps a width and stays inside shrink-to-fit and 1fr grid parents, directly or in a div`, { skip: !browser && "no Chromium" }, async () => {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.setContent('<!doctype html><body style="margin:0;font-family:Arial,sans-serif"></body>');
      await page.addScriptTag({ content: HA });
      await page.addScriptTag({ content: source });
      const config = tag.includes("overview") ? {} : { area: "kitchen" };
      const results = await page.evaluate(
        async ({ tag, config, hass, CONTEXTS }) => {
          const runs = [];
          for (const [name, width, parentStyle, count] of CONTEXTS) {
            for (const wrapped of [false, true]) {
              const outer = document.body.appendChild(document.createElement("div"));
              outer.style.width = `${width}px`;
              const parent = outer.appendChild(document.createElement("div"));
              parent.style.cssText = parentStyle;
              const cards = [];
              for (let i = 0; i < count; i++) {
                const card = document.createElement(tag);
                card.setConfig({ type: `custom:${tag}`, ...config });
                card.hass = { ...hass, callService() {} };
                parent.appendChild(wrapped ? document.createElement("div") : card);
                if (wrapped) parent.lastChild.appendChild(card);
                cards.push(card);
              }
              runs.push({ name: `${name}${wrapped ? " (in a div)" : ""}`, outer, cards });
            }
          }
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return runs.map(({ name, outer, cards }) => {
            const box = outer.getBoundingClientRect();
            return {
              name,
              cards: cards.map((card) => {
                const r = card.shadowRoot.querySelector("ha-card").getBoundingClientRect();
                return { width: Math.round(r.width), overflow: Math.round(r.right - box.right) };
              }),
            };
          });
        },
        { tag, config, hass, CONTEXTS },
      );
      assert.deepEqual(errors, []);
      for (const { name, cards } of results) {
        for (const { width, overflow } of cards) {
          assert.ok(overflow <= 0, `${name}: the card overflows its parent by ${overflow} px (width ${width})`);
          assert.ok(width >= 100, `${name}: the card falls to ${width} px`);
        }
        // A shrink-to-fit parent with room to spare: the card takes its natural width, not its borders.
        if (/^(inline-block|grid auto) 600/.test(name)) assert.ok(cards[0].width >= 300 && cards[0].width <= 360, `${name}: ${cards[0].width} px`);
      }
    } finally {
      await page.close();
    }
  });
}

// The overviews' room tiles at a phone's 6 columns of the Sections view (~156-178 px) and above: two (or the `columns`
// option's) tiles per row left the name 0-3 letters ("B…"), pushed a chip 4-34 px out of its tile and broke the state
// inside its words ("Pr|es|en|ce"). Every name keeps 4 letters, every chip stays in its tile, the state wraps between
// words (a word too long for its line ends with "…").
const ROOMS = [
  ["living_room", "Living room", [["binary_sensor.patio_door", "door", "on"], ["light.living_room", "light", "on"], ["switch.tv_plug", "outlet", "on", 1240]]],
  ["kitchen", "Kitchen", [["binary_sensor.sink_leak", "moisture", "on"], ["light.kitchen", "light", "on"]]],
  ["bedroom_2", "Bedroom 2", [["binary_sensor.bedroom_presence", "occupancy", "on"]]],
];
const ENV_ROOMS = [
  ["living_room", "Living room", { temperature: [24.6, "°C"], humidity: [66, "%"], carbon_dioxide: [1380, "ppm"] }],
  ["kitchen", "Kitchen", { temperature: [22.8, "°C"], humidity: [58, "%"], carbon_dioxide: [1180, "ppm"] }],
  ["bathroom", "Bathroom", { temperature: [23.5, "°C"], humidity: [74, "%"] }],
];
const roomsHass = (lang) => {
  const h = { language: lang, locale: { language: lang }, areas: {}, devices: {}, entities: {}, states: {} };
  for (const [area_id, name, items] of ROOMS) {
    h.areas[area_id] = { area_id, name };
    for (const [id, kind, state, watts] of items) {
      h.entities[id] = { area_id };
      h.states[id] = st(id, state, kind === "light" ? { friendly_name: id } : { device_class: kind, friendly_name: id });
      if (watts) {
        const p = `sensor.${id.split(".")[1]}_power`;
        h.devices[`d_${id}`] = { area_id };
        h.entities[id] = { device_id: `d_${id}` };
        h.entities[p] = { device_id: `d_${id}` };
        h.states[p] = st(p, String(watts), { device_class: "power", unit_of_measurement: "W" });
      }
    }
  }
  for (const [area_id, name, values] of ENV_ROOMS) {
    h.areas[area_id] = { area_id, name };
    for (const [device_class, [v, unit]] of Object.entries(values)) {
      const id = `sensor.${area_id}_${device_class}`;
      h.entities[id] = { area_id };
      h.states[id] = st(id, String(v), { device_class, unit_of_measurement: unit, friendly_name: id });
    }
  }
  return h;
};

for (const tag of ["room-overview-card", "room-environment-overview-card"]) {
  test(`${tag}: room tiles keep a readable name, their chips and an unbroken state at phone widths`, { skip: !browser && "no Chromium" }, async () => {
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await page.setContent('<!doctype html><body style="margin:0;font-family:Arial,sans-serif"></body>');
      await page.addScriptTag({ content: HA });
      await page.addScriptTag({ content: source });
      const runs = [];
      for (const lang of ["en", "pl", "sr-Latn", "uk", "hu", "lv"]) for (const config of [{}, { columns: 3 }]) for (const width of [156, 178, 245, 320]) runs.push({ lang, config, width, hass: roomsHass(lang) });
      const problems = await page.evaluate(
        async ({ tag, runs }) => {
          const cards = runs.map(({ config, width, hass }) => {
            const outer = document.body.appendChild(document.createElement("div"));
            outer.style.width = `${width}px`;
            const card = outer.appendChild(document.createElement(tag));
            card.setConfig({ type: `custom:${tag}`, ...config });
            card.hass = { ...hass, callService() {} };
            return card;
          });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const range = document.createRange();
          const charBox = (node, i) => {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            return range.getClientRects()[0];
          };
          return runs.flatMap(({ lang, config, width }, k) => {
            const where = `${lang} ${JSON.stringify(config)} ${width} px`;
            const root = cards[k].shadowRoot;
            const card = root.querySelector("ha-card").getBoundingClientRect();
            const out = [];
            const tiles = [...root.querySelectorAll(".room")];
            if (!tiles.length) out.push(`${where}: no room tile`);
            for (const tile of tiles) {
              const box = tile.getBoundingClientRect();
              if (box.left < card.left - 0.5 || box.right > card.right + 0.5) out.push(`${where}: a tile leaves the card`);
              // Letters of the name shown whole, left of its "…" when it has one.
              const name = tile.querySelector(".name");
              const end = name.getBoundingClientRect().right - (name.scrollWidth > name.clientWidth + 1 ? 8 : -0.5);
              let shown = 0;
              for (let i = 0; i < name.textContent.length; i++) if (charBox(name.firstChild, i)?.right <= end) shown++;
              if (shown < Math.min(4, name.textContent.length)) out.push(`${where}: "${name.textContent}" shows ${shown} letters`);
              for (const chip of tile.querySelectorAll(".chips > *")) {
                const c = chip.getBoundingClientRect();
                const past = Math.max(c.right - box.right, box.left - c.left, c.bottom - box.bottom);
                if (past > 0.5) out.push(`${where}: chip "${chip.textContent.trim()}" ${past.toFixed(1)} px out of its tile`);
              }
              // The state's lines: a new line starts after a space only.
              const state = tile.querySelector(".state");
              const text = state.firstChild;
              let top = null;
              for (let i = 0; text && i < text.length; i++) {
                const t = charBox(text, i)?.top;
                if (t == null) continue;
                if (top != null && t > top + 2 && !/\s/.test(text.data[i - 1]) && !/\s/.test(text.data[i]))
                  out.push(`${where}: "${text.data}" broken inside a word, before "${text.data.slice(i)}"`);
                top = t;
              }
              if (state.scrollWidth > state.clientWidth + 1 && getComputedStyle(state).textOverflow !== "ellipsis")
                out.push(`${where}: "${state.textContent}" cut without "…"`);
            }
            return out;
          });
        },
        { tag, runs },
      );
      assert.deepEqual(errors, []);
      assert.deepEqual(problems, []);
    } finally {
      await page.close();
    }
  });
}

test.after(() => browser?.close());

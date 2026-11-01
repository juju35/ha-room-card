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
  "room-switch-card",
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

test.after(() => browser?.close());

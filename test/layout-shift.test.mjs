// Home Assistant sets `hass` on every state change of the house: the cards must neither rebuild their nodes nor
// change height then, or the sections view reflows and the page moves by itself. In Chromium, with a <ha-card> that
// lays its content out a microtask late (as Home Assistant's Lit one): ten updates of an unrelated entity, then ten
// of the card's own readings. Needs Chromium (`npx playwright install chromium`) and the built bundle (`npm run build`).
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

let harness;
try {
  harness = await import("../scripts/screenshots/harness.mjs");
} catch {}
const built = harness && existsSync(`${harness.root}dist/ha-room-card.js`);
const browser = built ? await harness.launch().catch(() => null) : null;
const skip = !browser && (built ? "no Chromium" : "no bundle (npm run build)");
test.after(() => browser?.close());

const st = (entity_id, state, attributes) => ({ entity_id, state, last_changed: "2026-01-01T00:00:00Z", attributes });
// A room with a long name (the status pill takes a line of its own at this width), two lights, a plug with its power
// sensor, a window and two readings.
const mockHass = () => ({
  states: {
    "light.ceiling": st("light.ceiling", "on", { friendly_name: "Ceiling", brightness: 120, supported_color_modes: ["brightness"] }),
    "light.reading": st("light.reading", "on", { friendly_name: "Reading lamp", brightness: 200, supported_color_modes: ["brightness"] }),
    "switch.tv_plug": st("switch.tv_plug", "on", { friendly_name: "TV Plug", device_class: "outlet" }),
    "sensor.tv_plug_power": st("sensor.tv_plug_power", "86", { device_class: "power", unit_of_measurement: "W" }),
    "binary_sensor.window": st("binary_sensor.window", "on", { friendly_name: "Window", device_class: "window" }),
    "sensor.temperature": st("sensor.temperature", "21.4", { friendly_name: "Temperature", device_class: "temperature", unit_of_measurement: "°C" }),
    "sensor.humidity": st("sensor.humidity", "47", { friendly_name: "Humidity", device_class: "humidity", unit_of_measurement: "%" }),
  },
  entities: Object.fromEntries(
    ["light.ceiling", "light.reading", "switch.tv_plug", "binary_sensor.window", "sensor.temperature", "sensor.humidity"].map((id) => [
      id,
      { entity_id: id, device_id: id === "switch.tv_plug" ? "dev_plug" : null, area_id: "living" },
    ]).concat([["sensor.tv_plug_power", { entity_id: "sensor.tv_plug_power", device_id: "dev_plug", area_id: null }]]),
  ),
  devices: { dev_plug: { id: "dev_plug", area_id: "living" } },
  areas: { living: { area_id: "living", name: "Living and dining room" } },
  language: "en",
  locale: { language: "en" },
});

const CARDS = [
  ["room-overview-card", {}],
  ["room-environment-overview-card", {}],
  ["room-lights-card", { area: "living" }],
  ["room-lights-mini-card", { area: "living" }],
  ["room-switch-card", { area: "living" }],
  ["room-switch-mini-card", { area: "living" }],
  ["room-sensors-mini-card", { area: "living" }],
  ["room-environment-card", { area: "living" }],
  ["room-environment-mini-card", { area: "living" }],
  ["room-lights-card", { area: "living", illustration: false }],
];

for (const [tag, config] of CARDS) {
  test(`${tag}${config.illustration === false ? " (no illustration)" : ""}: updates patch in place, same height`, { skip }, async () => {
    const page = await harness.openPage(browser, { theme: "light", width: 300, icons: harness.iconsFor([]), lit: true });
    try {
      await harness.mountCard(page, { tag, hass: mockHass(), config });
      await page.waitForTimeout(300);
      const r = await page.evaluate(async () => {
        const el = document.getElementById("root").firstElementChild;
        const frame = () => new Promise((res) => requestAnimationFrame(res));
        const out = {};
        let rec = null;
        new MutationObserver((list) => {
          for (const m of list) rec.nodes += m.addedNodes.length + m.removedNodes.length;
        }).observe(el.shadowRoot, { childList: true, subtree: true });
        for (const relevant of [false, true]) {
          rec = { nodes: 0, heights: new Set(), wraps: new Set() };
          for (let i = 0; i < 10; i++) {
            const h = el._hass;
            const states = { ...h.states };
            const d = i % 2 ? 1 : -1;
            if (!relevant) states["sensor.elsewhere"] = { entity_id: "sensor.elsewhere", state: String(i), attributes: {} };
            else {
              states["sensor.temperature"] = { ...states["sensor.temperature"], state: (21.4 + d / 10).toFixed(1) };
              states["sensor.tv_plug_power"] = { ...states["sensor.tv_plug_power"], state: String(86 + d * 5) };
              const l = states["light.ceiling"];
              states["light.ceiling"] = { ...l, attributes: { ...l.attributes, brightness: 120 + d * 20 } };
            }
            el.hass = { ...h, states };
            await frame();
            rec.heights.add(Math.round(el.getBoundingClientRect().height * 100));
            rec.wraps.add([...el.shadowRoot.querySelectorAll("[data-wrap]")].length);
          }
          out[relevant ? "relevant" : "unrelated"] = { nodes: rec.nodes, heights: rec.heights.size, wraps: [...rec.wraps] };
        }
        return out;
      });
      assert.equal(r.unrelated.nodes, 0, "an unrelated update adds or removes no node");
      assert.equal(r.unrelated.heights, 1, "same height through unrelated updates");
      assert.equal(r.relevant.nodes, 0, "the card's own updates patch the nodes in place");
      assert.equal(r.relevant.heights, 1, "same height through the card's own updates");
      assert.equal(r.relevant.wraps.length, 1, "the status pill keeps its line");
    } finally {
      await page.close();
    }
  });
}

import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { load } from "./load.mjs";

const { cards } = load();

// The kitchen of the mock with a Zigbee smoke detector (and no state formatter, as on older Home Assistant).
const withSmoke = (state, extra = {}) => {
  const h = makeHass(extra);
  h.entities["binary_sensor.smoke"] = { area_id: "kitchen" };
  h.states["binary_sensor.smoke"] = {
    entity_id: "binary_sensor.smoke",
    state,
    attributes: { device_class: "smoke", friendly_name: "Smoke detector" },
    last_changed: "2026-01-01T00:00:00Z",
  };
  return h;
};

const sensorsCard = (hass) => {
  const card = new cards["room-sensors-card"]();
  card.setConfig({ area: "kitchen" });
  card.hass = hass;
  return card;
};

test("a smoke detector is found on its own and reads « Non détecté » when clear, never « Fermé »", () => {
  const card = sensorsCard(withSmoke("off"));
  const smoke = card._items.find((i) => i.id === "binary_sensor.smoke");
  assert.ok(smoke, "smoke detector discovered");
  assert.equal(smoke.kind, "smoke");
  assert.equal(smoke.state, "Non détecté");
  assert.equal(smoke.icon, "mdi:smoke-detector");
  assert.doesNotMatch(card.shadowRoot.innerHTML, /Smoke detector<\/div>\s*<div class="state">Fermé/);
});

test("the state of a safety sensor comes from Home Assistant's formatter when there is one", () => {
  const card = sensorsCard(withSmoke("off", { formatEntityState: (st) => (st.state === "on" ? "Détectée" : "RAS") }));
  assert.equal(card._items.find((i) => i.id === "binary_sensor.smoke").state, "RAS");
});

test("detected smoke is an alarm: first, alert level, smoke status and icon", () => {
  const card = sensorsCard(withSmoke("on"));
  const [first] = card._items;
  assert.equal(first.id, "binary_sensor.smoke");
  assert.equal(first.state, "Détecté");
  const sum = card._summary(card._items);
  assert.equal(sum.level, "alert");
  assert.equal(sum.status, "Fumée détectée");
  assert.equal(sum.icon, "mdi:smoke-detector-alert");
  assert.match(card.shadowRoot.innerHTML, /class="tile on leak/);
});

test("a water leak still reads as a leak, and smoke outranks it", () => {
  const h = withSmoke("on");
  h.entities["binary_sensor.leak"] = { area_id: "kitchen" };
  h.states["binary_sensor.leak"] = {
    entity_id: "binary_sensor.leak",
    state: "on",
    attributes: { device_class: "moisture", friendly_name: "Leak" },
    last_changed: "2026-01-01T00:00:00Z",
  };
  const card = sensorsCard(h);
  assert.equal(card._items.find((i) => i.id === "binary_sensor.leak").state, "Fuite !");
  assert.equal(card._summary(card._items).status, "Fumée détectée");
  h.states["binary_sensor.smoke"] = { ...h.states["binary_sensor.smoke"], state: "off" };
  card.hass = { ...h };
  assert.equal(card._summary(card._items).status, "Fuite d'eau");
});

test("the Overview raises the smoke alarm of a room, not an opening", () => {
  const overview = new cards["room-overview-card"]();
  overview._config = { ...cards["room-overview-card"].defaults };
  overview._hass = withSmoke("on");
  const [room] = overview._collect();
  assert.equal(room.leaks, 1);
  assert.equal(room.open, 1); // the open diagnostic door sensor of the mock, not the smoke detector
  assert.equal(room.alert, "smoke");
  const s = overview._roomState(room);
  assert.equal(s.lvl, "alert");
  assert.equal(s.text, "Fumée détectée");
});

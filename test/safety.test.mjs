import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { load } from "./load.mjs";

const { cards } = load();

// Smoke, carbon monoxide, gas and water leak detectors belong to ha-safety-card: the room cards leave them out.
const SAFETY = { smoke: "smoke", co: "carbon_monoxide", gas: "gas", leak: "moisture" };

// The kitchen of the mock with one detector of each safety kind, all detecting.
const withDetectors = () => {
  const h = makeHass();
  for (const [name, device_class] of Object.entries(SAFETY)) {
    const id = `binary_sensor.${name}`;
    h.entities[id] = { area_id: "kitchen" };
    h.states[id] = { entity_id: id, state: "on", attributes: { device_class, friendly_name: name }, last_changed: "2026-01-01T00:00:00Z" };
  }
  return h;
};

test("the Sensors card leaves smoke, CO, gas and leak detectors to the safety cards", () => {
  const card = new cards["room-sensors-card"]();
  card.setConfig({ area: "kitchen" });
  card.hass = withDetectors();
  for (const name of Object.keys(SAFETY)) assert.ok(!card._items.some((i) => i.id === `binary_sensor.${name}`), name);
  assert.notEqual(card._summary(card._items).level, "alert");
});

test("the Overview does not count safety detectors either", () => {
  const overview = new cards["room-overview-card"]();
  overview._config = { ...cards["room-overview-card"].defaults };
  overview._hass = withDetectors();
  const [room] = overview._collect();
  assert.ok(!room.sensors.some((s) => Object.keys(SAFETY).some((n) => s.id === `binary_sensor.${n}`)));
  assert.equal(room.open, 1); // the open diagnostic door sensor of the mock
  assert.equal(overview._roomState(room).lvl, "warn");
});

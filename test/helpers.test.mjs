import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { load } from "./load.mjs";

const rc = load();

test("rcCleanName strips prefix, suffix and area name", () => {
  assert.equal(rc.rcCleanName("Capteur Porte Cuisine Porte", "Cuisine", /^(capteur)\s+/i, /\s+(porte)$/i), "Porte");
  assert.equal(rc.rcCleanName("Kitchen", "Kitchen", /$^/, /$^/), "Kitchen");
});

test("rcIsPlug / rcIsLightSwitch tell plugs from light switches", () => {
  const sw = (name, dc) => ({ attributes: { friendly_name: name, device_class: dc } });
  assert.equal(rc.rcIsLightSwitch(sw("Lumière salon")), true);
  assert.equal(rc.rcIsPlug(sw("Lumière salon", "outlet")), false);
  assert.equal(rc.rcIsPlug(sw("Prise TV")), true);
  assert.equal(rc.rcIsPlug(sw("Relay", "outlet")), true);
});

test("shared matchers: sensors keep diagnostic entities, lights and plugs skip them", () => {
  const h = makeHass();
  assert.equal(rc.rcMatchSensor(h, "binary_sensor.diag_door"), true);
  assert.equal(rc.rcMatchLight(h, "light.ceiling"), true);
  assert.equal(rc.rcMatchPlug(h, "switch.coffee_plug"), true);
  assert.equal(rc.rcMatchPlug(h, "switch.relay"), false);
});

test("rcEsc escapes text and attribute values", () => {
  assert.equal(rc.rcEsc(`<a href="x">'&`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
});

test("rcMemo recomputes only when a dependency changes identity", () => {
  const store = {};
  let runs = 0;
  const a = {};
  rc.rcMemo(store, "k", [a], () => ++runs);
  rc.rcMemo(store, "k", [a], () => ++runs);
  assert.equal(runs, 1);
  rc.rcMemo(store, "k", [{}], () => ++runs);
  assert.equal(runs, 2);
});

test("rcPowerSensors finds a device's power sensor and follows new states", () => {
  const h = makeHass();
  assert.equal(rc.rcPowerSensors(h).d1, "sensor.coffee_power");
  const h2 = { ...h, states: { ...h.states, "sensor.coffee_power": { ...h.states["sensor.coffee_power"], state: "30" } } };
  assert.equal(rc.rcPowerSensors(h2).d1, "sensor.coffee_power");
});

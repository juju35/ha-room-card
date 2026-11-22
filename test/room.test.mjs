import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass } from "./hass.mjs";
import { load } from "./load.mjs";

const rc = load();
// Values built in the cards' sandbox, compared as plain data.
const plain = (v) => JSON.parse(JSON.stringify(v));
// The mock kitchen without its diagnostic door sensor (open): the room is then only its door, closed.
const kitchen = () => {
  const h = makeHass();
  delete h.states["binary_sensor.diag_door"];
  delete h.entities["binary_sensor.diag_door"];
  return h;
};
const ids = (items) => Array.from(items, (i) => i.id);
const room = (config, hass = kitchen()) => {
  const card = new rc.cards["room-card"]();
  card.setConfig({ area: "kitchen", language: "en", ...config });
  card.hass = hass;
  return card;
};

test("Room card: each section embeds its room card, framed by the room card, with the area's entities", () => {
  const card = room({});
  assert.deepEqual(Object.keys(card._kids), ["lights", "plugs", "sensors", "environment"]);
  assert.deepEqual(ids(card._items.lights), ["light.ceiling"]);
  assert.deepEqual(ids(card._items.plugs), ["switch.coffee_plug"]);
  assert.deepEqual(ids(card._items.sensors), ["binary_sensor.door"]);
  const lights = card._kids.lights._config;
  assert.equal(lights.embedded, true);
  assert.equal(lights.illustration, false);
  assert.equal(lights.title, "Lights");
  assert.equal(card._kids.plugs._config.title, "Plugs");
  // The readings have no zoom of their own and fetch no history.
  assert.equal(card._kids.environment._config.zoom, false);
  assert.equal(card._kids.environment._config.show_history, false);
});

test("Room card: status — an open door first, then the lights on, then all quiet", () => {
  const h = kitchen();
  const card = room({}, h);
  assert.deepEqual(plain(card._summary(card._items)), { level: "on", icon: "mdi:home-outline", status: "1 light on" });
  card.hass = { ...h, states: { ...h.states, "binary_sensor.door": { ...h.states["binary_sensor.door"], state: "on" } } };
  const s = card._summary(card._items);
  assert.equal(s.level, "warn");
  assert.equal(s.status, "1 open");
  card.hass = { ...h, states: { ...h.states, "light.ceiling": { ...h.states["light.ceiling"], state: "off" } } };
  assert.equal(card._summary(card._items).status, "All quiet");
});

test("Room card: header chips count the lights on and the plugs' power draw", () => {
  const card = room({});
  const chips = card._chips(card._items);
  assert.match(chips, /mdi:lightbulb.*<span>1<\/span>/);
  assert.match(chips, /mdi:power-socket-fr.*12 W/);
});

test("Room card: `sections` picks and orders the sections, `show_environment: false` drops the readings", () => {
  const card = room({ sections: ["sensors", "lights", "nope", "lights"], show_environment: false });
  assert.deepEqual(Object.keys(card._kids), ["sensors", "lights"]);
});

test("Room card: each `include` entity goes to the section of its kind", () => {
  const h = kitchen();
  const st = (entity_id, state, attributes) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });
  h.states["light.porch"] = st("light.porch", "off", { friendly_name: "Porch" });
  h.states["switch.hall_light"] = st("switch.hall_light", "off", { friendly_name: "Hall light" });
  h.states["switch.pump"] = st("switch.pump", "off", { friendly_name: "Pump" });
  h.states["binary_sensor.gate"] = st("binary_sensor.gate", "off", { friendly_name: "Gate" });
  h.states["sensor.temp"] = st("sensor.temp", "20", { device_class: "temperature", unit_of_measurement: "°C" });
  const card = room({ include: ["light.porch", "switch.hall_light", { entity: "switch.pump", name: "Pond" }, "binary_sensor.gate", "sensor.temp"] }, h);
  const inc = (k) => plain(card._kids[k]._config.include);
  assert.deepEqual(inc("lights"), ["light.porch", "switch.hall_light"]);
  assert.deepEqual(inc("plugs"), [{ entity: "switch.pump", name: "Pond" }]);
  assert.deepEqual(inc("sensors"), ["binary_sensor.gate"]);
  assert.deepEqual(inc("environment"), ["sensor.temp"]);
  assert.ok(ids(card._items.plugs).includes("switch.pump"));
});

test("Room card: `exclude` reaches every section, and the editor lists what the sections find", () => {
  const card = room({ exclude: ["light.ceiling"] });
  assert.deepEqual(ids(card._items.lights), []);
  const probe = new rc.cards["room-card"]();
  probe._hass = kitchen();
  probe._config = { ...rc.cards["room-card"].defaults, area: "kitchen", language: "en" };
  assert.deepEqual(
    Array.from(probe._entries(), (e) => e.entity),
    ["light.ceiling", "switch.coffee_plug", "binary_sensor.door"],
  );
});

test("Room card: a section with no area and nothing included is left out", () => {
  const h = kitchen();
  const card = new rc.cards["room-card"]();
  card.setConfig({ include: ["light.ceiling"], language: "en" });
  card.hass = h;
  assert.deepEqual(Object.keys(card._kids), ["lights"]);
});

test("Room card: the embedded cards are built again only when the config or the registries change", () => {
  const h = kitchen();
  const card = room({}, h);
  const kids = card._kids;
  card.hass = { ...h, states: { ...h.states } };
  assert.equal(card._kids, kids);
  card.setConfig({ area: "kitchen", language: "en", columns: 3 });
  assert.notEqual(card._kids, kids);
  assert.equal(card._kids.lights._config.columns, 3);
});

test("Room mini card: readings, then a pill for the lights on, the plugs on and someone there", () => {
  const h = kitchen();
  h.states["binary_sensor.motion"] = { entity_id: "binary_sensor.motion", state: "on", attributes: { device_class: "occupancy", friendly_name: "Motion" }, last_changed: "2026-01-01T00:00:00Z" };
  h.entities["binary_sensor.motion"] = { area_id: "kitchen" };
  const card = new rc.cards["room-mini-card"]();
  let painted;
  card._paintMini = (p) => {
    painted = p;
  };
  card.setConfig({ area: "kitchen", language: "en" });
  card.hass = h;
  assert.match(painted.chips, /data-id="light.ceiling"/);
  assert.match(painted.chips, /data-id="switch.coffee_plug"[^>]*>.*12 W/s);
  assert.match(painted.chips, /data-id="binary_sensor.motion"/);
});

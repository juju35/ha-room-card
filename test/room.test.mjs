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
  assert.deepEqual(Object.keys(card._kids), ["lights", "plugs", "sensors", "climate", "covers", "media", "appliances", "environment"]);
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

test("Room card: `section_titles` renames the sections, the others keep their name (#115)", () => {
  const card = room({ section_titles: { lights: "Lighting", sensors: "Openings", plugs: "  " } });
  assert.equal(card._kids.lights._config.title, "Lighting");
  assert.equal(card._kids.sensors._config.title, "Openings");
  assert.equal(card._kids.plugs._config.title, "Plugs"); // blank: the default name
  assert.equal(card._kids.climate._config.title, "Climate");
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

// #114: climate, covers, media and appliances of the room as control sections, and as indicators.
const busyKitchen = () => {
  const h = kitchen();
  const add = (id, state, attributes, extra = {}) => {
    h.states[id] = { entity_id: id, state, attributes, last_changed: "2026-01-01T00:00:00Z" };
    h.entities[id] = { area_id: "kitchen", ...extra };
  };
  add("climate.radiator", "heat", { friendly_name: "Kitchen Radiator", hvac_action: "heating", current_temperature: 19.6, temperature: 20, target_temp_step: 0.5, min_temp: 7, max_temp: 30 });
  add("cover.bay", "open", { friendly_name: "Bay", current_position: 40, supported_features: 15 });
  add("media_player.tv", "playing", { friendly_name: "TV", media_title: "News", supported_features: 16385 });
  add("sensor.dishwasher_operation_state", "run", { friendly_name: "Dishwasher Operation state" }, { device_id: "dw" });
  add("sensor.dishwasher_remaining_program_time", "42", { friendly_name: "Remaining", unit_of_measurement: "min" }, { device_id: "dw" });
  add("binary_sensor.smoke", "off", { friendly_name: "Smoke", device_class: "smoke" });
  h.devices = { ...(h.devices || {}), dw: { id: "dw", name: "Dishwasher", area_id: "kitchen" } };
  return h;
};

test("Room card: climate, covers, media and appliances of the area as control sections (#114)", () => {
  const card = room({}, busyKitchen());
  const ctl = card._items.controls;
  assert.deepEqual(ids(ctl.climate), ["climate.radiator"]);
  assert.deepEqual(ids(ctl.covers), ["cover.bay"]);
  assert.deepEqual(ids(ctl.media), ["media_player.tv"]);
  assert.deepEqual(ids(ctl.appliances), ["sensor.dishwasher_operation_state"]);
  assert.equal(ctl.appliances[0].remaining, 42);
  assert.equal(card._kids.climate._config.title, "Climate");
  assert.equal(card._kids.custom, undefined); // nothing configured
  const html = card._kids.climate.shadowRoot.innerHTML;
  assert.match(html, /data-act="down"/);
  assert.match(html, /20°/);
  assert.match(card._kids.covers.shadowRoot.innerHTML, /data-act="open"[\s\S]*data-act="stop"[\s\S]*data-act="close"/);
  assert.match(card._kids.media.shadowRoot.innerHTML, /data-act="playpause"/);
});

test("Room card: the set temperature steps with − / +, sent once the taps pause", async () => {
  const h = busyKitchen();
  const calls = [];
  h.callService = (d, s, data) => calls.push([d, s, plain(data)]);
  const card = room({}, h);
  const sec = card._kids.climate;
  const item = sec._items[0];
  sec._step(item, 1);
  sec._step(item, 1);
  assert.equal(calls.length, 0);
  await new Promise((r) => setTimeout(r, 800));
  assert.deepEqual(calls, [["climate", "set_temperature", { entity_id: "climate.radiator", temperature: 21 }]]);
});

test("Room card: indicators for heating, covers open, playing, an appliance running, and the configured ones (#114)", () => {
  const h = busyKitchen();
  const card = room({ indicators: [{ entity: "binary_sensor.smoke", icon: "mdi:smoke-detector-variant", color: "red" }] }, h);
  let ind = plain(card._indicators(card._items));
  assert.deepEqual(ind.map((i) => i.cls), ["heat", "cover", "media", "run"]); // the smoke detector is clear
  assert.equal(ind[3].text, "42 min");
  h.states["binary_sensor.smoke"] = { ...h.states["binary_sensor.smoke"], state: "on" };
  card.hass = { ...h, states: { ...h.states } };
  ind = plain(card._indicators(card._items));
  assert.equal(ind.at(-1).id, "binary_sensor.smoke");
  assert.equal(ind.at(-1).style, "--ind:var(--rc-alert)");
  // auto_indicators: false keeps only the configured ones.
  const quiet = room({ auto_indicators: false, indicators: ["binary_sensor.smoke"] }, card._hass);
  assert.deepEqual(plain(quiet._indicators(quiet._items)).map((i) => i.id), ["binary_sensor.smoke"]);
});

test("Room card: indicator conditions — state, state_not, above / below; a colour cannot carry another declaration", () => {
  const st = (state) => ({ state, attributes: {} });
  assert.equal(rc.cards["room-card"].indicatorActive(st("on"), {}), true);
  assert.equal(rc.cards["room-card"].indicatorActive(st("off"), {}), false);
  assert.equal(rc.cards["room-card"].indicatorActive(st("programmed"), { state: ["programmed", "run"] }), true);
  assert.equal(rc.cards["room-card"].indicatorActive(st("idle"), { state_not: "idle" }), false);
  assert.equal(rc.cards["room-card"].indicatorActive(st("31"), { above: 30 }), true);
  assert.equal(rc.cards["room-card"].indicatorActive(st("x"), { below: 3 }), false);
  assert.equal(rc.cards["room-card"].indicatorColor("blue"), "var(--rc-info)");
  assert.equal(rc.cards["room-card"].indicatorColor("#ff0000"), "#ff0000");
  assert.equal(rc.cards["room-card"].indicatorColor("red;background:url(x)"), "");
});

test("Room mini card: the indicators follow the lights, plugs and presence pills (#114)", () => {
  const card = new rc.cards["room-mini-card"]();
  let painted;
  card._paintMini = (p) => {
    painted = p;
  };
  card.setConfig({ area: "kitchen", language: "en" });
  card.hass = busyKitchen();
  assert.match(painted.chips, /class="r pill heat" data-id="climate.radiator"/);
  assert.match(painted.chips, /class="r pill cover" data-id="cover.bay"[^>]*>.*<span>1<\/span>/s);
  assert.match(painted.chips, /class="r pill run" data-id="sensor.dishwasher_operation_state"[^>]*>.*42 min/s);
});

test("Room card: custom_entities make a custom section with toggles and buttons", () => {
  const h = busyKitchen();
  h.states["input_boolean.guest"] = { entity_id: "input_boolean.guest", state: "off", attributes: { friendly_name: "Guest mode" } };
  h.states["script.coffee"] = { entity_id: "script.coffee", state: "off", attributes: { friendly_name: "Coffee" } };
  const card = room({ custom_entities: ["input_boolean.guest", "script.coffee"] }, h);
  assert.deepEqual(ids(card._items.controls.custom), ["input_boolean.guest", "script.coffee"]);
  const html = card._kids.custom.shadowRoot.innerHTML;
  assert.match(html, /data-act="toggle"/);
  assert.match(html, /data-act="press"/);
});

test("helpers and template entities can be included in the sensors (#118)", () => {
  const h = kitchen();
  const st = (entity_id, state, attributes) => ({ entity_id, state, attributes, last_changed: "2026-01-01T00:00:00Z" });
  h.states["input_boolean.entrydoor_hook"] = st("input_boolean.entrydoor_hook", "on", { friendly_name: "Entry door hook" });
  h.states["sensor.gate_status"] = st("sensor.gate_status", "Ajar", { friendly_name: "Gate status" });
  h.states["sensor.hall_temp"] = st("sensor.hall_temp", "20", { device_class: "temperature", unit_of_measurement: "°C" });
  // The editor offers them, the environment readings excepted on the Sensors card.
  const offered = (tag) => {
    const card = rc.cards[tag];
    return Object.keys(h.states).filter((id) => card.includeDomains.includes(id.split(".")[0]) && (!card.includeMatch || card.includeMatch(h, id)));
  };
  const sensorsOffer = offered("room-sensors-card");
  assert.ok(sensorsOffer.includes("input_boolean.entrydoor_hook"));
  assert.ok(sensorsOffer.includes("sensor.gate_status"));
  assert.ok(!sensorsOffer.includes("sensor.hall_temp"));
  const roomOffer = offered("room-card");
  assert.ok(roomOffer.includes("input_boolean.entrydoor_hook") && roomOffer.includes("sensor.gate_status") && roomOffer.includes("sensor.hall_temp"));
  // The room card routes them: the boolean and the text sensor to Sensors, the reading to the environment line.
  const card = room({ include: ["input_boolean.entrydoor_hook", "sensor.gate_status", "sensor.hall_temp"] }, h);
  assert.deepEqual(plain(card._kids.sensors._config.include), ["input_boolean.entrydoor_hook", "sensor.gate_status"]);
  assert.deepEqual(plain(card._kids.environment._config.include), ["sensor.hall_temp"]);
  // The boolean reads as an opening (on = open); the text sensor shows its state and never counts as open.
  const items = card._kids.sensors._collect();
  const hook = items.find((i) => i.id === "input_boolean.entrydoor_hook");
  const gate = items.find((i) => i.id === "sensor.gate_status");
  assert.equal(hook.on, true);
  assert.equal(hook.state, "Open");
  assert.equal(gate.on, false);
  assert.equal(gate.state, "Ajar");
});

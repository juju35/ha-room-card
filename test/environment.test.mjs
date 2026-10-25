import assert from "node:assert/strict";
import { test } from "node:test";
import { load } from "./load.mjs";

const rc = load();
const Card = rc.cards["room-environment-card"];

const st = (entity_id, state, device_class, unit, name) => ({
  entity_id,
  state: String(state),
  attributes: { device_class, unit_of_measurement: unit, friendly_name: name ?? entity_id },
  last_changed: "2026-01-01T00:00:00Z",
});

// A living room with the five kinds of readings, a diagnostic temperature, a battery and a door sensor.
const makeHass = (values = {}, extra = {}) => {
  const v = { temp: 21.4, hum: 48, co2: 650, noise: 38, lux: 320, ...values };
  const states = {
    "sensor.lr_temperature": st("sensor.lr_temperature", v.temp, "temperature", v.tempUnit ?? "°C", "Salon Température"),
    "sensor.lr_humidity": st("sensor.lr_humidity", v.hum, "humidity", "%", "Salon Humidité"),
    "sensor.lr_co2": st("sensor.lr_co2", v.co2, "carbon_dioxide", "ppm", "Salon CO2"),
    "sensor.lr_noise": st("sensor.lr_noise", v.noise, "sound_pressure", "dB", "Salon Bruit"),
    "sensor.lr_lux": st("sensor.lr_lux", v.lux, "illuminance", "lx", "Salon Luminosité"),
    "sensor.lr_cpu_temp": st("sensor.lr_cpu_temp", 55, "temperature", "°C", "TV CPU"),
    "sensor.lr_battery": st("sensor.lr_battery", 80, "battery", "%", "Remote battery"),
    "binary_sensor.lr_door": st("binary_sensor.lr_door", "off", "door", undefined, "Door"),
    "sensor.kitchen_temperature": st("sensor.kitchen_temperature", 20, "temperature", "°C", "Cuisine Température"),
    ...extra,
  };
  const entities = Object.fromEntries(
    Object.keys(states).map((id) => [id, { area_id: id.startsWith("sensor.kitchen") ? "kitchen" : "living_room" }]),
  );
  entities["sensor.lr_cpu_temp"].entity_category = "diagnostic";
  return {
    language: "fr",
    locale: { language: "fr" },
    areas: { living_room: { area_id: "living_room", name: "Salon" }, kitchen: { area_id: "kitchen", name: "Cuisine" } },
    devices: {},
    entities,
    states,
    callService() {},
  };
};

const render = (config, hass = makeHass()) => {
  const card = new Card();
  card.setConfig({ area: "living_room", ...config });
  card.hass = hass;
  return card;
};
const ids = (card) => [...card._items].map((i) => i.id);
const head = (card) => card.shadowRoot.innerHTML;

test("finds the environment sensors of the area, in kind order, skipping diagnostics and other classes", () => {
  const card = render();
  assert.deepEqual(ids(card), ["sensor.lr_temperature", "sensor.lr_humidity", "sensor.lr_co2", "sensor.lr_noise", "sensor.lr_lux"]);
  assert.deepEqual(
    [...card._items].map((i) => i.name),
    ["Température", "Humidité", "CO₂", "Bruit", "Luminosité"],
  );
});

test("comfortable readings: green card, formatted values in the language of HA", () => {
  const card = render();
  assert.match(head(card), /lvl-ok/);
  assert.match(head(card), /Confortable/);
  const temp = card._items[0];
  assert.equal(temp.value, "21,4 °C");
  assert.equal(temp.word, "Confortable");
  assert.equal(card._items[4].word, "Lumineux");
});

test("the worst reading drives the header: CO₂ to ventilate, then a very humid room on top", () => {
  let card = render({}, makeHass({ co2: 1200 }));
  assert.match(head(card), /lvl-warn/);
  assert.match(head(card), /Aérer/);
  card = render({}, makeHass({ co2: 1200, hum: 75 }));
  assert.match(head(card), /lvl-alert/);
  assert.match(head(card), /Trop humide \+1/);
});

test("a cool room is information (blue), a cold one a warning, both blue", () => {
  let card = render({}, makeHass({ temp: 17.5 }));
  assert.equal(card._items[0].sev, "info");
  assert.match(head(card), /lvl-cold/);
  assert.match(head(card), /Frais/);
  card = render({}, makeHass({ temp: 15 }));
  assert.equal(card._items[0].sev, "warn");
  assert.match(head(card), /Trop froid/);
});

test("Fahrenheit sensors use converted thresholds", () => {
  const card = render({}, makeHass({ temp: 80, tempUnit: "°F" }));
  assert.equal(card._items[0].word, "Chaud");
  assert.equal(card._items[0].sev, "warn");
});

test("custom thresholds, in the sensor's unit", () => {
  const card = render({ thresholds: { co2: [800, 1200] } }, makeHass({ co2: 900 }));
  assert.equal(card._items.find((i) => i.kind === "co2").sev, "warn");
});

test("parts-per-billion VOC sensors use their own scale", () => {
  const voc = st("sensor.lr_voc", 700, "volatile_organic_compounds_parts", "ppb", "Salon COV");
  const card = render({}, makeHass({}, { "sensor.lr_voc": voc }));
  const item = card._items.find((i) => i.kind === "voc");
  assert.equal(item.sev, "alert");
  assert.match(head(card), /Air pollué/);
});

test("two sensors of the same kind are told apart by their own name", () => {
  const second = st("sensor.lr_netatmo_temperature", 22, "temperature", "°C", "Netatmo Salon Température");
  const card = render({}, makeHass({}, { "sensor.lr_netatmo_temperature": second }));
  const names = [...card._items].filter((i) => i.kind === "temperature").map((i) => i.name);
  assert.deepEqual(names.sort(), ["Température", "Température · Netatmo"]);
});

test("only_alerts keeps the readings outside the comfort range and the unavailable ones", () => {
  const card = render({ only_alerts: true }, makeHass({ co2: 1600, noise: "unavailable" }));
  assert.equal(card._shown, 2);
  assert.ok(head(card).includes('data-id="sensor.lr_co2"'));
  assert.ok(head(card).includes('data-id="sensor.lr_noise"'));
  assert.ok(!head(card).includes('data-id="sensor.lr_temperature"'));
});

test("the editor offers only environment sensors to add", () => {
  const editor = new (rc.customElements.get("room-environment-card-editor"))();
  editor.appendChild = () => {};
  editor.setConfig({ area: "living_room" });
  editor.hass = makeHass();
  const field = [...editor._form.schema].find((s) => s.name === "include");
  assert.deepEqual([...field.selector.entity.include_entities], ["sensor.kitchen_temperature"]);
});

test("the mini card shows one chip per reading with a short unit, and the status on the title line", () => {
  const card = new rc.cards["room-environment-mini-card"]();
  card.setConfig({ area: "living_room" });
  card.hass = makeHass({ co2: 1200 });
  const html = card.shadowRoot.innerHTML;
  assert.equal((html.match(/class="r /g) || []).length, 5);
  assert.match(html, /<span>21,4<\/span><small>°<\/small>/);
  assert.match(html, /class="st">Aérer</);
  assert.match(html, /lvl-warn/);
  assert.equal(card.getCardSize(), 1);
});

test("the mini card with only_alerts keeps the readings that need a look", () => {
  const card = new rc.cards["room-environment-mini-card"]();
  card.setConfig({ area: "living_room", only_alerts: true });
  card.hass = makeHass({ hum: 72 });
  const html = card.shadowRoot.innerHTML;
  assert.equal((html.match(/class="r /g) || []).length, 1);
  assert.ok(html.includes('data-id="sensor.lr_humidity"'));
});

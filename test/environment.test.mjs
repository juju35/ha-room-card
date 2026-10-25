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
    ["Température", "Humidité", "CO2", "Bruit", "Luminosité"],
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

test("several sensors of the same kind make one reading: their mean", () => {
  const second = st("sensor.lr_netatmo_temperature", 22, "temperature", "°C", "Netatmo Salon Température");
  const card = render({}, makeHass({}, { "sensor.lr_netatmo_temperature": second }));
  const temps = [...card._items].filter((i) => i.kind === "temperature");
  assert.equal(temps.length, 1);
  assert.equal(temps[0].name, "Température");
  assert.equal(temps[0].value, "21,7 °C");
  assert.deepEqual([...temps[0].ids], ["sensor.lr_temperature", "sensor.lr_netatmo_temperature"]);
});

test("unavailable and unknown sensors are ignored, in the mean and as tiles", () => {
  const extra = {
    "sensor.lr_t2": st("sensor.lr_t2", "unavailable", "temperature", "°C", "T2"),
    "sensor.lr_t3": st("sensor.lr_t3", "unknown", "temperature", "°C", "T3"),
  };
  const card = render({}, makeHass({ noise: "unavailable" }, extra));
  const temp = card._items[0];
  assert.equal(temp.value, "21,4 °C");
  assert.deepEqual([...temp.ids], ["sensor.lr_temperature"]);
  assert.ok(!card._items.some((i) => i.kind === "noise"));
});

test("only_alerts keeps the readings outside the comfort range", () => {
  const card = render({ only_alerts: true }, makeHass({ co2: 1600, noise: 72 }));
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
  assert.match(html, /class="r s-warn pill k-co2"/);
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

// Two rooms for the overview: the living room of makeHass and the kitchen with its temperature sensor.
const overview = (config = {}, hass = makeHass()) => {
  const card = new (rc.customElements.get("room-environment-overview-card"))();
  // Every room unless the test says otherwise (`zoom: true`: the compact view, rooms needing a look only).
  card._config = { ...card.constructor.defaults, zoom: false, ...config };
  card._hass = hass;
  return card;
};

test("the overview groups the environment sensors by room, with each room's status", () => {
  const rooms = [...overview({}, makeHass({ co2: 1200 }))._collect()];
  assert.deepEqual(
    rooms.map((x) => [x.id, x.items.length, x.status, x.level]),
    [
      ["kitchen", 1, "Confortable", "ok"],
      ["living_room", 5, "Aérer", "warn"],
    ],
  );
});

test("the overview sorts rooms needing a look first, shows only those until zoomed in, and leaves excluded rooms out", () => {
  const hass = makeHass({ hum: 75 });
  const ids = (config) => [...overview(config, hass)._collect()].map((x) => x.id);
  assert.deepEqual(
    ids({ sort: "state" }),
    ["living_room", "kitchen"],
  );
  assert.deepEqual(
    ids({ zoom: true }),
    ["living_room"],
  );
  assert.deepEqual(
    ids({ exclude_areas: ["living_room"] }),
    ["kitchen"],
  );
});

test("the overview averages the first temperature of each room", () => {
  const card = overview();
  assert.equal(card._average(card._collect(), "temperature", 1), "20,7");
  assert.equal(card._average(card._collect(), "humidity", 0), "48");
});

test("a bathroom tolerates more humidity: 61 % is comfortable there, not in the living room", () => {
  const bath = st("sensor.bath_humidity", 61, "humidity", "%", "Salle de bain Humidité");
  const hass = makeHass({ hum: 61 }, { "sensor.bath_humidity": bath });
  hass.areas.bathroom = { area_id: "bathroom", name: "Salle de bain" };
  hass.entities["sensor.bath_humidity"] = { area_id: "bathroom" };
  const rooms = Object.fromEntries([...overview({}, hass)._collect()].map((x) => [x.id, x]));
  assert.equal(rooms.bathroom.level, "ok");
  assert.equal(rooms.living_room.items.find((i) => i.kind === "humidity").sev, "warn");
  hass.states["sensor.bath_humidity"] = st("sensor.bath_humidity", 72, "humidity", "%", "Salle de bain Humidité");
  assert.equal([...overview({}, hass)._collect()].find((x) => x.id === "bathroom").level, "warn");
  // The room card of the bathroom applies the same limits.
  const card = render({ area: "bathroom" }, hass);
  assert.equal(card._items[0].sev, "warn");
  assert.equal(card._items[0].word, "Humide");
});

test("thresholds can be set per room in the overview, over the card's", () => {
  const hass = makeHass({ hum: 63, co2: 900 });
  const rooms = (config) => Object.fromEntries([...overview(config, hass)._collect()].map((x) => [x.id, x]));
  assert.equal(rooms({}).living_room.level, "warn");
  const lr = rooms({ thresholds: { co2: [800, 1200] }, rooms: [{ area: "living_room", thresholds: { humidity: [20, 30, 65, 75] } }] })
    .living_room;
  assert.equal(lr.items.find((i) => i.kind === "humidity").sev, "ok");
  assert.equal(lr.items.find((i) => i.kind === "co2").sev, "warn");
});

test("the mini card zoomed in draws the full Environment card, and back", () => {
  const card = new rc.cards["room-environment-mini-card"]();
  card.setConfig({ area: "living_room" });
  card.hass = makeHass();
  assert.match(card.shadowRoot.innerHTML, /class="mini"/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  const html = card.shadowRoot.innerHTML;
  assert.doesNotMatch(html, /class="mini"/);
  assert.equal((html.match(/class="tile /g) || []).length, 5);
  assert.match(html, /class="gauge"/);
  assert.ok(card.getCardSize() > 1);
  card._zoomed = false;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="mini"/);
  assert.equal(card.getCardSize(), 1);
});

test("zoomed in, the environment mini card shows every reading, whatever only_alerts says", () => {
  const card = new rc.cards["room-environment-mini-card"]();
  card.setConfig({ area: "living_room", only_alerts: true });
  card.hass = makeHass({ co2: 1200 });
  assert.equal(card._shown, 1);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.equal(card._shown, 5);
});

test("the overview's detail button shows every room, and back", () => {
  const card = overview({ zoom: true }, makeHass({ hum: 75 }));
  assert.deepEqual([...card._collect()].map((x) => x.id), ["living_room"]);
  card._zoomed = true;
  assert.deepEqual([...card._collect()].map((x) => x.id), ["kitchen", "living_room"]);
  card._zoomed = false;
  assert.deepEqual([...card._collect()].map((x) => x.id), ["living_room"]);
  // The averages still count every room.
  assert.equal(card._average(card._everyRoom, "temperature", 1), "20,7");
});

test("a click elsewhere brings the environment mini card and overview back to their compact view", () => {
  const mini = new rc.cards["room-environment-mini-card"]();
  mini.setConfig({ area: "living_room" });
  mini.hass = makeHass();
  mini._zoomed = true;
  mini._onUnzoom({ composedPath: () => [{ localName: "div" }] });
  assert.equal(mini._zoomed, false);
  const card = overview({ zoom: true });
  card._zoomed = true;
  card._render = () => {};
  card._onOutside({ composedPath: () => [{ localName: "div" }] });
  assert.equal(card._zoomed, false);
});

test("outdoors, temperature and humidity are information only, unless thresholds are set for them", () => {
  const hass = makeHass({ temp: 15, hum: 82, co2: 1200 });
  hass.areas.living_room.name = "Terrasse";
  const card = render({}, hass);
  const of = (c, kind) => c._items.find((i) => i.kind === kind);
  assert.equal(of(card, "temperature").sev, "ok");
  assert.equal(of(card, "temperature").cold, false);
  assert.equal(of(card, "humidity").sev, "ok");
  assert.equal(of(card, "co2").sev, "warn", "other readings keep their thresholds");
  assert.doesNotMatch(head(card), /Trop froid|Trop humide/);
  // The user's own thresholds still apply outdoors.
  assert.equal(of(render({ thresholds: { temperature: [5, 10, 30, 35] } }, hass), "temperature").sev, "ok");
  assert.equal(of(render({ thresholds: { temperature: [16, 18, 30, 35] } }, hass), "temperature").sev, "warn");
  // In the overview, a terrace at 15 °C is not a room to check.
  const rooms = Object.fromEntries([...overview({}, makeHass({ temp: 15 }))._collect()].map((x) => [x.id, x]));
  assert.equal(rooms.living_room.level, "cold", "indoors, 15 °C is too cold");
  const h2 = makeHass({ temp: 15 });
  h2.areas.living_room.name = "Terrasse";
  const outdoor = Object.fromEntries([...overview({}, h2)._collect()].map((x) => [x.id, x]));
  assert.equal(outdoor.living_room.level, "ok");
});

test("noise: conversation and TV are quiet, 70 dB noisy, 85 dB very noisy", () => {
  const sev = (noise) => render({}, makeHass({ noise }))._items.find((i) => i.kind === "noise").sev;
  assert.equal(sev(62), "ok");
  assert.equal(sev(72), "warn");
  assert.equal(sev(88), "alert");
});

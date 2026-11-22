// Renders the Room card (and its mini card) with a mock kitchen and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/room.mjs
import { pair, shoot, shootTiles } from "./harness.mjs";

// Two lights, two smart plugs (a power sensor on each plug's device), a patio door, a window, a presence sensor and
// three environment readings.
const LIGHTS = [
  ["light.kitchen_ceiling", "Kitchen Ceiling"],
  ["light.kitchen_worktop", "Kitchen Worktop"],
];
const PLUGS = [
  ["switch.kettle_plug", "Kettle Plug", "mdi:kettle"],
  ["switch.coffee_machine_plug", "Coffee Machine Plug", "mdi:coffee-maker"],
];
const SENSORS = [
  ["binary_sensor.kitchen_patio_door", "Kitchen Patio Door Contact", "door"],
  ["binary_sensor.kitchen_window", "Kitchen Window Contact", "window"],
  ["binary_sensor.kitchen_presence", "Kitchen Presence", "occupancy"],
];
const ENV = [
  ["sensor.kitchen_temperature", "Kitchen Temperature", "temperature", "°C", 21.4],
  ["sensor.kitchen_humidity", "Kitchen Humidity", "humidity", "%", 47],
  ["sensor.kitchen_co2", "Kitchen CO2", "carbon_dioxide", "ppm", 640],
];
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

// Busy: the patio door open, someone there, the ceiling light at 60 %, the kettle drawing 1.2 kW. Quiet: everything
// off and closed.
const BUSY = { on: ["light.kitchen_ceiling", "switch.kettle_plug", "binary_sensor.kitchen_patio_door", "binary_sensor.kitchen_presence"] };
const QUIET = { on: [] };

const setup = (s) => {
  const on = new Set(s.on);
  const states = {};
  const entities = {};
  const devices = {};
  const add = (entity_id, attributes, state, extra = {}) => {
    states[entity_id] = { entity_id, state, last_changed: ago(entity_id.includes("door") ? 12 : 5), attributes };
    entities[entity_id] = { entity_id, area_id: "kitchen", ...extra };
  };
  for (const [id, name] of LIGHTS) {
    add(id, { friendly_name: name, supported_color_modes: ["brightness"], ...(on.has(id) ? { brightness: 153 } : {}) }, on.has(id) ? "on" : "off");
  }
  for (const [id, name, icon] of PLUGS) {
    const dev = `dev_${id.slice(7)}`;
    const power = `sensor.${id.slice(7)}_power`;
    devices[dev] = { id: dev, area_id: "kitchen" };
    states[id] = { entity_id: id, state: on.has(id) ? "on" : "off", attributes: { friendly_name: name, device_class: "outlet", icon } };
    entities[id] = { entity_id: id, device_id: dev };
    states[power] = { entity_id: power, state: on.has(id) ? "1240" : "0", attributes: { device_class: "power", unit_of_measurement: "W" } };
    entities[power] = { entity_id: power, device_id: dev };
  }
  for (const [id, name, device_class] of SENSORS) add(id, { friendly_name: name, device_class }, on.has(id) ? "on" : "off");
  for (const [id, name, device_class, unit, value] of ENV) add(id, { friendly_name: name, device_class, unit_of_measurement: unit }, String(value));
  const areas = { kitchen: { area_id: "kitchen", name: "Kitchen", icon: "mdi:silverware-fork-knife" } };
  return {
    hass: { states, entities, devices, areas, language: "en", locale: { language: "en" } },
    config: { area: "kitchen", ...(s.config || {}) },
  };
};

const icons = ["mdi:kettle", "mdi:coffee-maker", "mdi:silverware-fork-knife"];
await shoot({
  prefix: "room",
  tag: "room-card",
  icons,
  shots: [...pair("busy", BUSY), ...pair("quiet", QUIET), ...pair("folded", { ...BUSY, config: { collapsed: ["plugs", "sensors"] } })],
  setup,
});
// The tiles layout at a phone's width: one large tile per entity, two columns.
await shootTiles({ prefix: "room", tag: "room-card", icons, setup }, BUSY);
// The mini card, and the same card zoomed in (its zoom button clicked).
await shoot({
  prefix: "room-mini",
  tag: "room-mini-card",
  icons,
  shots: [...pair("busy", BUSY), ...pair("quiet", QUIET), ...pair("zoom", { ...BUSY, zoom: true })],
  setup: (s) => ({ ...setup(s), open: s.zoom && ".zoom" }),
});

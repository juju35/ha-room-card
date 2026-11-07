// Renders the plugs card with a mock living room and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/switch.mjs
import { pair, shoot } from "./harness.mjs";

// Four smart plugs, each with a power sensor on the same device.
const PLUGS = [
  ["switch.microwave", { en: "Microwave", fr: "Micro-onde" }, "mdi:microwave"],
  ["switch.coffee_machine", { en: "Coffee Machine Plug", fr: "Prise Machine à café" }, "mdi:coffee-maker"],
  ["switch.network_switch", { en: "Network Switch", fr: "Switch réseau" }, "mdi:switch"],
  ["switch.weather_station", { en: "Weather Station", fr: "Station Météo" }, "mdi:weather-partly-cloudy"],
];
const DAY = { "switch.network_switch": 6.4, "switch.weather_station": 1.2, "switch.coffee_machine": 1240 };

const icons = ["mdi:microwave", "mdi:coffee-maker", "mdi:switch", "mdi:weather-partly-cloudy"];
const shots = [...pair("on", { on: DAY }), ...pair("off", { on: {} })];
const setup = (s, lang) => {
  const states = {};
  const entities = {};
  const devices = {};
  for (const [entity_id, names, icon] of PLUGS) {
    const lit = entity_id in s.on;
    const dev = `dev_${entity_id.slice(7)}`;
    const power = `sensor.${entity_id.slice(7)}_power`;
    devices[dev] = { id: dev, area_id: "living_room" };
    states[entity_id] = { entity_id, state: lit ? "on" : "off", attributes: { friendly_name: names[lang], device_class: "outlet", icon } };
    states[power] = { entity_id: power, state: String(lit ? s.on[entity_id] : 0), attributes: { device_class: "power", unit_of_measurement: "W" } };
    entities[entity_id] = { entity_id, device_id: dev };
    entities[power] = { entity_id: power, device_id: dev };
  }
  const areas = { living_room: { area_id: "living_room", name: lang === "fr" ? "Séjour" : "Living room" } };
  return { hass: { states, entities, devices, areas, language: lang, locale: { language: lang } }, config: { area: "living_room", all_off_button: true } };
};

await shoot({ prefix: "switch", tag: "room-switch-card", icons, shots, setup });
// The mini card, and the same card zoomed in (its zoom button clicked).
await shoot({
  prefix: "switch-mini",
  tag: "room-switch-mini-card",
  icons,
  shots: [...shots, ...pair("zoom", { on: DAY, zoom: true })],
  setup: (s, lang) => ({ ...setup(s, lang), open: s.zoom && ".zoom" }),
});

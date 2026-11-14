// Renders the environment card with a mock living room and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/environment.mjs
import { pair, shoot } from "./harness.mjs";

// Temperature, humidity, CO₂, PM2.5, noise and light level of the living room.
const SENSORS = [
  ["sensor.living_room_temperature", { en: "Living Room Temperature", fr: "Séjour Température" }, "temperature", "°C"],
  ["sensor.living_room_humidity", { en: "Living Room Humidity", fr: "Séjour Humidité" }, "humidity", "%"],
  ["sensor.living_room_co2", { en: "Living Room CO2", fr: "Séjour CO2" }, "carbon_dioxide", "ppm"],
  ["sensor.living_room_pm25", { en: "Living Room PM2.5", fr: "Séjour PM2.5" }, "pm25", "µg/m³"],
  ["sensor.living_room_noise", { en: "Living Room Noise", fr: "Séjour Bruit" }, "sound_pressure", "dB"],
  ["sensor.living_room_illuminance", { en: "Living Room Illuminance", fr: "Séjour Luminosité" }, "illuminance", "lx"],
];
const COMFORT = [21.4, 47, 640, 6, 36, 320];
const STUFFY = [24.6, 66, 1380, 9, 74, 140];

const setup = (s, lang) => {
    const states = {};
    const entities = {};
    SENSORS.forEach(([entity_id, names, device_class, unit], n) => {
      states[entity_id] = {
        entity_id,
        state: String(s.values[n]),
        last_changed: new Date().toISOString(),
        attributes: { device_class, unit_of_measurement: unit, friendly_name: names[lang] },
      };
      entities[entity_id] = { entity_id, area_id: "living_room" };
    });
    const areas = { living_room: { area_id: "living_room", name: lang === "fr" ? "Séjour" : "Living room" } };
    return {
      hass: { states, entities, devices: {}, areas, language: lang, locale: { language: lang } },
      config: { area: "living_room" },
    };
};

// Recorder mock for the 24 h curves behind the tiles: 5-minute means drifting through the day (warmer and more CO₂
// in the evening) and ending at each reading's value now.
const ws = `window.__ws = async (msg) => {
  if (msg.type !== "recorder/statistics_during_period") return {};
  // Asked from the hass setter, before the card is in the page: answer once it is.
  await new Promise((r) => setTimeout(r, 50));
  const states = document.querySelector("#root").firstElementChild._hass.states;
  const step = 300000, now = Math.floor(Date.now() / step) * step, out = {};
  msg.statistic_ids.forEach((id, k) => {
    const v = Number(states[id]?.state);
    if (!Number.isFinite(v)) return;
    out[id] = Array.from({ length: 288 }, (_, i) => {
      const a = (i / 288) * 2 * Math.PI;
      const wave = 0.1 * Math.sin(a * 2 + k) + 0.03 * Math.sin(a * 5 + 2 * k);
      return { start: now - (287 - i) * step, mean: v * (1 + wave * (1 - i / 287)) };
    });
  });
  return out;
};`;

const shots = [...pair("comfort", { values: COMFORT }), ...pair("stuffy", { values: STUFFY })];
await shoot({ prefix: "environment", tag: "room-environment-card", shots, setup, ws });
// The mini card with the five readings of a typical indoor station (PM2.5 left out): a single line of readings.
await shoot({
  prefix: "environment-mini",
  tag: "room-environment-mini-card",
  shots: [...shots, ...pair("zoom", { values: STUFFY, zoom: true })],
  ws,
  setup: (s, lang) => {
    const { hass, config } = setup(s, lang);
    return { hass, config: { ...config, exclude: ["sensor.living_room_pm25"] }, open: s.zoom && ".zoom" };
  },
});

// The tiles layout at a phone's width: one tile per temperature probe of the house, listed with `entities`, each
// tinted by the default colour thresholds (cold blue to hot red).
const PROBES = [
  ["sensor.garage_temperature", "Garage", 13.2],
  ["sensor.bedroom_temperature", "Bedroom", 17.6],
  ["sensor.living_room_temperature", "Living room", 21.4],
  ["sensor.office_temperature", "Office", 20.2],
  ["sensor.kitchen_temperature", "Kitchen", 24.3],
  ["sensor.attic_temperature", "Attic", 27.8],
];
await shoot({
  prefix: "environment",
  tag: "room-environment-card",
  shots: pair("tiles", { width: 380 }),
  ws,
  setup: (_s, lang) => {
    const states = {};
    const entities = {};
    for (const [entity_id, name, value] of PROBES) {
      states[entity_id] = {
        entity_id,
        state: String(value),
        last_changed: new Date().toISOString(),
        attributes: { device_class: "temperature", unit_of_measurement: "°C", friendly_name: name },
      };
      entities[entity_id] = { entity_id };
    }
    return {
      hass: { states, entities, devices: {}, areas: {}, language: lang, locale: { language: lang } },
      config: { title: "Temperatures", layout: "tiles", show_gauge: false, entities: PROBES.map(([id]) => id) },
    };
  },
});

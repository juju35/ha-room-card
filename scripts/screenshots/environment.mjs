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
const STUFFY = [24.6, 66, 1380, 9, 58, 140];

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

const shots = [...pair("comfort", { values: COMFORT }), ...pair("stuffy", { values: STUFFY })];
await shoot({ prefix: "environment", tag: "room-environment-card", shots, setup });
// The mini card with the five readings of a typical indoor station (PM2.5 left out): a single line of readings.
await shoot({
  prefix: "environment-mini",
  tag: "room-environment-mini-card",
  shots,
  setup: (s, lang) => {
    const { hass, config } = setup(s, lang);
    return { hass, config: { ...config, exclude: ["sensor.living_room_pm25"] } };
  },
});

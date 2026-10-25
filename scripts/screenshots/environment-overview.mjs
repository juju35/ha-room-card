// Renders the environment overview card with a mock home and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/environment-overview.mjs
import { pair, shoot } from "./harness.mjs";

// [area, names, { temperature, humidity, co2, pm25, noise, illuminance }]
const ROOMS = [
  ["living_room", { en: "Living room", fr: "Séjour" }, { temperature: 21.4, humidity: 47, co2: 640, noise: 38, illuminance: 320 }],
  ["kitchen", { en: "Kitchen", fr: "Cuisine" }, { temperature: 22.8, humidity: 58, co2: 1180 }],
  ["bedroom_1", { en: "Bedroom 1", fr: "Chambre 1" }, { temperature: 17.4, humidity: 52, co2: 880 }],
  ["bedroom_2", { en: "Bedroom 2", fr: "Chambre 2" }, { temperature: 19.8, humidity: 44 }],
  ["bathroom", { en: "Bathroom", fr: "Salle de bain" }, { temperature: 23.5, humidity: 74 }],
  ["office", { en: "Office", fr: "Bureau" }, { temperature: 20.9, humidity: 45, co2: 760, pm25: 22 }],
];
const KINDS = {
  temperature: ["temperature", "°C", { en: "Temperature", fr: "Température" }],
  humidity: ["humidity", "%", { en: "Humidity", fr: "Humidité" }],
  co2: ["carbon_dioxide", "ppm", { en: "CO2", fr: "CO2" }],
  pm25: ["pm25", "µg/m³", { en: "PM2.5", fr: "PM2.5" }],
  noise: ["sound_pressure", "dB", { en: "Noise", fr: "Bruit" }],
  illuminance: ["illuminance", "lx", { en: "Illuminance", fr: "Luminosité" }],
};

const mockHass = (lang) => {
  const states = {};
  const entities = {};
  const areas = {};
  for (const [area_id, names, values] of ROOMS) {
    areas[area_id] = { area_id, name: names[lang], icon: null };
    for (const [kind, value] of Object.entries(values)) {
      const [device_class, unit, label] = KINDS[kind];
      const entity_id = `sensor.${area_id}_${kind}`;
      entities[entity_id] = { entity_id, area_id };
      states[entity_id] = {
        entity_id,
        state: String(value),
        last_changed: new Date().toISOString(),
        attributes: { device_class, unit_of_measurement: unit, friendly_name: `${names[lang]} ${label[lang]}` },
      };
    }
  }
  return { states, entities, devices: {}, areas, language: lang, locale: { language: lang } };
};

await shoot({
  prefix: "environment-overview",
  tag: "room-environment-overview-card",
  // "all": every room (detail button pressed); "check": the default view; "details": a room unfolded.
  shots: [...pair("all", { zoom: true }), ...pair("check"), ...pair("details", { open: "kitchen" })],
  setup: (s, lang) => ({ hass: mockHass(lang), config: {}, open: s.zoom ? ".zoom" : s.open && `.room[data-area="${s.open}"]` }),
});

// Renders the sensors card with a mock living room and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/sensors.mjs
import { pair, shoot } from "./harness.mjs";

// Leak sensor, two sliding doors, a window, a presence sensor and a camera motion detection (left out by the card).
const SENSORS = [
  ["binary_sensor.sink_leak", { en: "Sink Leak", fr: "Capteur Évier Fuite d'eau" }, "moisture"],
  ["binary_sensor.kitchen_porte_fenetre_door", { en: "Kitchen Patio Door Contact", fr: "Capteur Porte Fenêtre Cuisine Porte" }, "door"],
  ["binary_sensor.living_room_porte_fenetre_door", { en: "Living Room Patio Door Contact", fr: "Capteur Porte Fenêtre Salon Porte" }, "door"],
  ["binary_sensor.living_room_window", { en: "Living Room Window Contact", fr: "Capteur Fenêtre Salon Porte" }, "window"],
  ["binary_sensor.living_room_occupancy", { en: "Living Room Presence Occupancy", fr: "Capteur Présence Séjour Occupation" }, "occupancy"],
  ["binary_sensor.living_room_camera_motion", { en: "Living Room Camera Motion", fr: "Caméra Séjour Mouvement" }, "motion", "camera"],
];
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
const OPEN = {
  "binary_sensor.kitchen_porte_fenetre_door": [true, 12],
  "binary_sensor.living_room_occupancy": [true, 5],
  "binary_sensor.living_room_camera_motion": [true, 1],
};
const LEAK = { ...OPEN, "binary_sensor.sink_leak": [true, 3] };

const setup = (s, lang) => {
  const states = {};
  const entities = { "camera.living_room": { entity_id: "camera.living_room", device_id: "camera" } };
  for (const [entity_id, names, device_class, device] of SENSORS) {
    const [on, min] = s.open[entity_id] ?? [false, 180];
    states[entity_id] = { entity_id, state: on ? "on" : "off", last_changed: ago(min), attributes: { device_class, friendly_name: names[lang] } };
    entities[entity_id] = { entity_id, area_id: "living_room", device_id: device };
  }
  const areas = { living_room: { area_id: "living_room", name: lang === "fr" ? "Séjour" : "Living room" } };
  return { hass: { states, entities, devices: {}, areas, language: lang, locale: { language: lang } }, config: { area: "living_room", blink: false } };
};

const shots = [...pair("open", { open: OPEN }), ...pair("leak", { open: LEAK })];
await shoot({ prefix: "sensors", tag: "room-sensors-card", shots, setup });
// The mini card, and the same card zoomed in (its zoom button clicked).
await shoot({
  prefix: "sensors-mini",
  tag: "room-sensors-mini-card",
  shots: [...shots, ...pair("zoom", { open: OPEN, zoom: true })],
  setup: (s, lang) => ({ ...setup(s, lang), open: s.zoom && ".zoom" }),
});

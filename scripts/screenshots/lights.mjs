// Renders the lights card with a mock living room and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/lights.mjs
import { pair, shoot } from "./harness.mjs";

// Two ceiling lights, a lamp on a smart plug and a night light.
const LIGHTS = [
  ["light.kitchen", { en: "Kitchen", fr: "Cuisine" }, ["color_temp", "xy"], "mdi:ceiling-light"],
  ["light.living_room", { en: "Living Room", fr: "Salon" }, ["color_temp", "xy"], "mdi:ceiling-light"],
  ["switch.sofa_lamp", { en: "Sofa Lamp", fr: "Lumière Canapé" }, null, "mdi:floor-lamp"],
  ["light.night_light", { en: "Living Room Night Light", fr: "Séjour Veilleuse" }, ["hs"], "mdi:lightbulb-night"],
];
const EVENING = { "light.kitchen": [102, [255, 141, 26]], "switch.sofa_lamp": [], "light.night_light": [64, [120, 90, 255]] };

const icons = ["mdi:ceiling-light", "mdi:floor-lamp", "mdi:lightbulb-night"];
const shots = [...pair("on", { on: EVENING }), ...pair("off", { on: {} })];
const setup = (s, lang) => {
  const states = {};
  const entities = {};
  for (const [entity_id, names, modes, icon] of LIGHTS) {
    const [brightness, rgb] = s.on[entity_id] ?? [];
    const lit = entity_id in s.on;
    const attributes = { friendly_name: names[lang], icon };
    if (modes) Object.assign(attributes, { supported_color_modes: modes, brightness: lit ? brightness : null, rgb_color: lit ? rgb : null });
    states[entity_id] = { entity_id, state: lit ? "on" : "off", attributes };
    entities[entity_id] = { entity_id, area_id: "living_room" };
  }
  const areas = { living_room: { area_id: "living_room", name: lang === "fr" ? "Séjour" : "Living room" } };
  return { hass: { states, entities, devices: {}, areas, language: lang, locale: { language: lang } }, config: { area: "living_room" } };
};

await shoot({ prefix: "lights", tag: "room-lights-card", icons, shots, setup });
// The mini card, and the same card zoomed in (its zoom button clicked).
await shoot({
  prefix: "lights-mini",
  tag: "room-lights-mini-card",
  icons,
  shots: [...shots, ...pair("zoom", { on: EVENING, zoom: true })],
  setup: (s, lang) => ({ ...setup(s, lang), open: s.zoom && ".zoom" }),
});

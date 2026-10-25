// Renders the overview card with a mock home and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/overview.mjs
import { pair, shoot } from "./harness.mjs";

// Mock home: [area, names, [entity_id, names, domain/class, state, extra]].
const ROOMS = [
  ["living_room", { en: "Living room", fr: "Séjour" }, [
    ["binary_sensor.patio_door", { en: "Patio Door Contact", fr: "Capteur Porte Fenêtre Porte" }, "door", "on"],
    ["binary_sensor.living_room_window", { en: "Window Contact", fr: "Capteur Fenêtre Porte" }, "window", "off"],
    ["light.living_room", { en: "Ceiling", fr: "Plafonnier" }, "light", "on", { brightness: 150, rgb_color: [255, 170, 80] }],
    ["light.reading", { en: "Reading Light", fr: "Liseuse" }, "light", "off"],
    ["switch.tv_plug", { en: "TV Plug", fr: "Prise Télé" }, "outlet", "on", { watts: 86 }],
  ]],
  ["kitchen", { en: "Kitchen", fr: "Cuisine" }, [
    ["binary_sensor.sink_leak", { en: "Sink Leak", fr: "Capteur Évier Fuite d'eau" }, "moisture", "on"],
    ["light.kitchen", { en: "Kitchen", fr: "Cuisine" }, "light", "on", { brightness: 255 }],
    ["switch.coffee_plug", { en: "Coffee Machine Plug", fr: "Prise Machine à café" }, "outlet", "on", { watts: 1240 }],
  ]],
  ["bedroom_1", { en: "Bedroom 1", fr: "Chambre 1" }, [
    ["binary_sensor.bedroom_1_window", { en: "Window Contact", fr: "Capteur Fenêtre Porte" }, "window", "off"],
    ["light.bedroom_1", { en: "Bedroom 1", fr: "Chambre 1" }, "light", "off"],
  ]],
  ["bedroom_2", { en: "Bedroom 2", fr: "Chambre 2" }, [
    ["binary_sensor.bedroom_2_window", { en: "Window Contact", fr: "Capteur Fenêtre Porte" }, "window", "off"],
    ["binary_sensor.bedroom_2_presence", { en: "Presence Occupancy", fr: "Capteur Présence Occupation" }, "occupancy", "on"],
    ["light.bedroom_2", { en: "Bedroom 2", fr: "Chambre 2" }, "light", "on", { brightness: 60, rgb_color: [140, 110, 255] }],
  ]],
  ["bathroom", { en: "Bathroom", fr: "Salle de bain" }, [
    ["binary_sensor.bathroom_leak", { en: "Bathroom Leak", fr: "Capteur Fuite Salle de bain Fuite d'eau" }, "moisture", "off"],
    ["binary_sensor.bathroom_presence", { en: "Presence Occupancy", fr: "Capteur Présence Occupation" }, "occupancy", "off"],
    ["light.bathroom", { en: "Bathroom", fr: "Salle de bain" }, "light", "off"],
  ]],
  ["entrance", { en: "Entrance", fr: "Entrée" }, [
    ["binary_sensor.front_door", { en: "Front Door Contact", fr: "Capteur Porte Entrée Porte" }, "door", "off"],
    ["light.entrance", { en: "Entrance", fr: "Entrée" }, "light", "off"],
  ]],
];

const mockHass = (lang, dry) => {
  const states = {}, entities = {}, devices = {}, areas = {};
  for (const [area_id, names, items] of ROOMS) {
    areas[area_id] = { area_id, name: names[lang], icon: null };
    for (const [entity_id, n, kind, state0, extra = {}] of items) {
      const state = dry && kind === "moisture" ? "off" : state0;
      const dev = `dev_${entity_id.split(".")[1]}`;
      devices[dev] = { id: dev, area_id };
      entities[entity_id] = { entity_id, device_id: dev, area_id: null, platform: "mock" };
      const attributes = { friendly_name: n[lang] };
      if (kind === "light") Object.assign(attributes, { supported_color_modes: ["color_temp", "xy"], brightness: state === "on" ? extra.brightness : null, rgb_color: state === "on" ? extra.rgb_color : null });
      else attributes.device_class = kind;
      states[entity_id] = { entity_id, state, last_changed: new Date(Date.now() - 9 * 60000).toISOString(), attributes };
      if (kind === "outlet") {
        const p = `sensor.${entity_id.split(".")[1]}_power`;
        entities[p] = { entity_id: p, device_id: dev, area_id: null, platform: "mock" };
        states[p] = { entity_id: p, state: String(state === "on" ? extra.watts : 0), attributes: { device_class: "power", unit_of_measurement: "W" } };
      }
    }
  }
  return { states, entities, devices, areas, language: lang, locale: { language: lang } };
};

await shoot({
  prefix: "overview",
  tag: "room-overview-card",
  // "all": every room (detail button pressed); "active": the default view; "details": a room unfolded.
  shots: [...pair("all", { zoom: true }), ...pair("active"), ...pair("details", { open: "living_room", dry: true })],
  setup: (s, lang) => ({
    hass: mockHass(lang, s.dry),
    config: { plugs_off_button: true },
    open: s.zoom ? ".zoom" : s.open && `.room[data-area="${s.open}"]`,
  }),
});

// ── Sections ─────────────────────────────────────────────────────────────────
// Each section is one of the room cards, embedded (no frame of its own, a header that folds the section): the room card
// reuses their discovery, tiles, actions and hold-to-dim as they are. The environment readings sit under the banner,
// with no header. Default order: lights, plugs, then sensors.
import { RM_I18N } from "./i18n/rm-i18n.js";

// Then the control sections (#114, see controls.js): climate, covers, media players, appliances, custom entities.
export const RM_CONTROLS = ["climate", "covers", "media", "appliances", "custom"];
export const RM_SECTIONS = {
  lights: "room-lights-card",
  plugs: "room-switch-card",
  sensors: "room-sensors-card",
  ...Object.fromEntries(RM_CONTROLS.map((k) => [k, "room-controls-section"])),
};
export const RM_ORDER = Object.keys(RM_SECTIONS);
export const RM_ENV = "room-environment-mini-card";

// The section an `include` entity goes to, from its domain (a switch named like a light goes to the lights).
export const rmRoute = (hass, id) => {
  const domain = id.split(".")[0];
  if (domain === "light") return "lights";
  if (domain === "switch") return hass.states[id] && rcIsLightSwitch(hass.states[id]) ? "lights" : "plugs";
  if (domain === "binary_sensor") return "sensors";
  if (domain === "sensor") return "environment";
  if (domain === "climate") return "climate";
  if (domain === "cover") return "covers";
  if (domain === "media_player") return "media";
  return null;
};

// A section's title: the embedded card's own ("Lights", "Plugs", "Sensors"), or the control section's ("Climate"…), in
// the card's language.
export const rmTitle = (key, lang) => {
  if (RM_CONTROLS.includes(key)) return rcT(RM_I18N, lang, `sec_${key}`);
  const card = customElements.get(RM_SECTIONS[key]);
  return card ? rcT(card.i18n, lang, "title") : key;
};

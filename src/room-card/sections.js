// ── Sections ─────────────────────────────────────────────────────────────────
// Each section is one of the room cards, embedded (no frame of its own, a header that folds the section): the room card
// reuses their discovery, tiles, actions and hold-to-dim as they are. The environment readings sit under the banner,
// with no header. Default order: lights, plugs, then sensors.
export const RM_SECTIONS = { lights: "room-lights-card", plugs: "room-switch-card", sensors: "room-sensors-card" };
export const RM_ORDER = Object.keys(RM_SECTIONS);
export const RM_ENV = "room-environment-mini-card";

// The section an `include` entity goes to, from its domain (a switch named like a light goes to the lights).
export const rmRoute = (hass, id) => {
  const domain = id.split(".")[0];
  if (domain === "light") return "lights";
  if (domain === "switch") return hass.states[id] && rcIsLightSwitch(hass.states[id]) ? "lights" : "plugs";
  if (domain === "binary_sensor") return "sensors";
  if (domain === "sensor") return "environment";
  return null;
};

// A section's title: the embedded card's own ("Lights", "Plugs", "Sensors"), in the card's language.
export const rmTitle = (tag, lang) => {
  const card = customElements.get(tag);
  return card ? rcT(card.i18n, lang, "title") : tag;
};

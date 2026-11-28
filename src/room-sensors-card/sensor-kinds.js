// ── Sensor kinds ─────────────────────────────────────────────────────────────
// `fem`: the state is feminine in the languages that have `open_f` / `closed_f` (fr: porte, fenêtre; es: puerta, ventana;
// it: porta, finestra; pt: porta, janela; ro: ușă, fereastră).
// `info`: an active state that is not an opening (presence, motion).
export const RS_KINDS = {
  slide: { on: "mdi:door-sliding-open", off: "mdi:door-sliding", fem: true },
  window: { on: "mdi:window-open-variant", off: "mdi:window-closed-variant", fem: true },
  garage: { on: "mdi:garage-open", off: "mdi:garage" },
  door: { on: "mdi:door-open", off: "mdi:door-closed", fem: true },
  opening: { on: "mdi:square-rounded-badge-outline", off: "mdi:square-rounded-outline" },
  presence: { on: "mdi:account", off: "mdi:account-outline", info: true },
  motion: { on: "mdi:motion-sensor", off: "mdi:motion-sensor-off", info: true },
};

// An on/off entity of the card: a binary sensor, or an input boolean added through `include` (#118).
export const rsIsBinary = (id) => id.startsWith("binary_sensor.") || id.startsWith("input_boolean.");
// A sensor the card can show as a state (#118): no unit (a template's text state…) and not a room reading, which the
// environment cards show.
export const rsTextSensor = (hass, id) =>
  id.startsWith("sensor.") &&
  !!hass.states[id] &&
  !hass.states[id].attributes.unit_of_measurement &&
  !customElements.get("room-environment-card")?.includeMatch?.(hass, id);
// Icon of an included text sensor, unless the entity sets its own.
export const RS_STATE_ICON = "mdi:information-outline";
// The state of another included entity (a template sensor's text, say), as Home Assistant shows it.
export const rsRawState = (hass, st) => {
  if (typeof hass.formatEntityState === "function") return hass.formatEntityState(st);
  const unit = st.attributes.unit_of_measurement;
  return unit ? `${st.state} ${unit}` : st.state;
};

export const rsKindOf = (st) => {
  const dc = st.attributes.device_class;
  const id = st.entity_id;
  if (dc === "occupancy" || dc === "presence") return "presence";
  if (dc === "motion") return "motion";
  if (dc === "garage_door") return "garage";
  if (/porte_fenetre|baie|sliding|patio/.test(id)) return "slide";
  if (dc === "window" || /fenetre|window/.test(id)) return "window";
  if (dc === "door") return "door";
  return "opening";
};

// "Capteur Porte Fenêtre Cuisine Porte" → "Porte Fenêtre Cuisine",
// "Capteur Présence Entrée Occupation" in Entrée → "Présence"
export const RS_PREFIX = /^(capteur|sensor)\s+/i;
export const RS_SUFFIX =
  /\s+(porte|ouverture|contact|door|window|opening|occupation|occupancy|motion|mouvement)$/i;

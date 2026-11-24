// ── i18n ─────────────────────────────────────────────────────────────────────

// "Lumière Canapé" → "Canapé", "Séjour Veilleuse" in Séjour → "Veilleuse"
export const RL_PREFIX = /^(lumi[eè]re|lampe|light|lamp)\s+/i;
export const RL_SUFFIX = /$^/;
// Keyboard dimming: the light is called this long after the last ←/→ step.
export const RL_KEY_MS = 300;

// Scenes: "Scène Lecture" → "Lecture"; a Hue scene also loses its Hue room's name ("Séjour Lecture" → "Lecture").
export const RL_SCENE_PREFIX = /^(sc[eè]ne|scene)\s+/i;

// Brightness can be set unless the light only supports on/off.
export const rlDimmable = (st) =>
  st.entity_id.startsWith("light.") && (st.attributes.supported_color_modes || []).some((m) => m !== "onoff");

// ── Editor ───────────────────────────────────────────────────────────────────
import { RoomLightsCard } from "./card.js";
import { RL_I18N } from "./i18n/rl-i18n.js";

export const RoomLightsCardEditor = rcEditor({
  card: RoomLightsCard,
  helpers: ["title", "navigation_path", "layout", "only_on", "hide_when_off", "show_brightness", "all_off_button", "show_scenes", "scenes", "include", "names", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RL_I18N, lang),
    ...rcBooleans("show_title", "only_on", "hide_when_off", "show_brightness", "all_off_button", "show_scenes"),
    ...rcIllustrationFields(RL_I18N, lang),
    ...rcIncludeField(RoomLightsCard, hass, config),
    ...rcExcludeField(RoomLightsCard, hass, config),
    ...rcRenameField(RoomLightsCard, hass, config),
    ...rcAdvanced(RL_I18N, lang, "entities", "scenes", "language"),
  ],
});

rcRegister(
  RoomLightsCard,
  RoomLightsCardEditor,
  "Room Lights Card",
  "Lights of a room: tap to toggle, drag to dim, turn everything off from the header",
);

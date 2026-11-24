// ── Editor ───────────────────────────────────────────────────────────────────
// `outdoor` left unset follows the room's name: the editor shows that guess, and keeps it out of the YAML.
import { RoomSensorsCard } from "./card.js";
import { RS_I18N } from "./i18n/rs-i18n.js";

export const RS_AUTOS = { outdoor: (hass, config) => rcIsOutdoor(hass?.areas?.[config?.area]) };

export const RoomSensorsCardEditor = rcEditor({
  card: RoomSensorsCard,
  helpers: ["title", "layout", "only_alerts", "hide_when_clear", "presence", "outdoor", "include", "names", ...RC_ADVANCED_HELPERS],
  autos: RS_AUTOS,
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RS_I18N, lang),
    ...rcBooleans("show_title", "only_alerts", "hide_when_clear", "presence", "outdoor", "blink"),
    ...rcIllustrationFields(RS_I18N, lang, true),
    ...rcIncludeField(RoomSensorsCard, hass, config),
    ...rcExcludeField(RoomSensorsCard, hass, config),
    ...rcRenameField(RoomSensorsCard, hass, config),
    ...rcAdvanced(RS_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomSensorsCard,
  RoomSensorsCardEditor,
  "Room Sensors Card",
  "Door, window, opening and presence sensors of a room, open ones first",
);

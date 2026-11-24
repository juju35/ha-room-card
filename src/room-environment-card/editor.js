// ── Editor ───────────────────────────────────────────────────────────────────
import { RoomEnvironmentCard } from "./card.js";
import { RE_I18N } from "./i18n/re-i18n.js";

export const RoomEnvironmentCardEditor = rcEditor({
  card: RoomEnvironmentCard,
  helpers: ["title", "navigation_path", "layout", "only_alerts", "show_gauge", "show_history", "include", "names", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RE_I18N, lang),
    ...rcBooleans("show_title", "only_alerts", "show_gauge", "show_history"),
    ...rcIllustrationFields(RE_I18N, lang, true),
    ...rcIncludeField(RoomEnvironmentCard, hass, config),
    ...rcExcludeField(RoomEnvironmentCard, hass, config),
    ...rcRenameField(RoomEnvironmentCard, hass, config),
    ...rcAdvanced(RE_I18N, lang, "thresholds", "entities", "language"),
  ],
});

rcRegister(
  RoomEnvironmentCard,
  RoomEnvironmentCardEditor,
  "Room Environment Card",
  "Temperature, humidity, air quality, noise and light level of a room, coloured by comfort",
);

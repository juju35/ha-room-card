// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status (*2/4 on*, with the button turning every light off), then a
// pill tinted with its colour for each light that is on, the icon alone for the others. The zoom button switches to
// the full Lights card (tap to toggle, drag to dim, the scenes) and back. `columns`, `show_brightness` and the scenes
// only shape the zoomed-in view.
import { RoomLightsCard } from "./card.js";
import { RL_I18N } from "./i18n/rl-i18n.js";

export class RoomLightsMiniCard extends rcToggleMini(RoomLightsCard, "room-lights-mini-card", ".r.on { --t: var(--rc-light); }") {}

export const RoomLightsMiniCardEditor = rcEditor({
  card: RoomLightsMiniCard,
  helpers: ["title", "navigation_path", "layout", "columns", "only_on", "hide_when_off", "show_brightness", "all_off_button", "zoom", "show_scenes", "scenes", "include", "names", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RL_I18N, lang),
    ...rcBooleans("show_title", "only_on", "hide_when_off", "all_off_button", "zoom", "show_brightness", "show_scenes"),
    ...rcIllustrationFields(RL_I18N, lang),
    ...rcIncludeField(RoomLightsMiniCard, hass, config),
    ...rcExcludeField(RoomLightsMiniCard, hass, config),
    ...rcRenameField(RoomLightsMiniCard, hass, config),
    ...rcAdvanced(RL_I18N, lang, "entities", "scenes", "language"),
  ],
});

rcRegister(
  RoomLightsMiniCard,
  RoomLightsMiniCardEditor,
  "Room Lights Mini Card",
  "The lights of a room on two lines: how many are on, a button to turn them all off, and a zoom to the full card",
);

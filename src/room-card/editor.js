// ── Editor ───────────────────────────────────────────────────────────────────
// The sections to show and to fold, picked from the list (labels in the card's language).
import { RM_ORDER, rmTitle } from "./sections.js";
import { RoomCard } from "./card.js";
import { RM_I18N } from "./i18n/rm-i18n.js";

export const rmSectionsField = (name, lang) => ({
  name,
  selector: { select: { multiple: true, mode: "list", options: RM_ORDER.map((value) => ({ value, label: rmTitle(value, lang) })) } },
});

export const rmSchema = (card, booleans) => (lang, hass, config) => [
  ...rcAreaFields(true),
  rcLayoutField(RM_I18N, lang),
  ...rcBooleans("show_title", "show_environment", "auto_indicators", ...booleans),
  rmSectionsField("sections", lang),
  rmSectionsField("collapsed", lang),
  ...rcIllustrationFields(RM_I18N, lang, true),
  ...rcIncludeField(card, hass, config),
  ...rcExcludeField(card, hass, config),
  ...rcRenameField(card, hass, config),
  ...rcAdvanced(RM_I18N, lang, "language"),
];
export const RM_HELPERS = ["title", "navigation_path", "layout", "columns", "show_environment", "auto_indicators", "sections", "collapsed", "include", "names", "language"];

rcRegister(
  RoomCard,
  rcEditor({ card: RoomCard, helpers: RM_HELPERS, schema: rmSchema(RoomCard, []) }),
  "Room Card",
  "A whole room in one card: lights, plugs, door, window and presence sensors, environment readings",
);

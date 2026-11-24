// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then a tinted pill (icon and name) for each open or detecting
// sensor; quiet sensors only show once zoomed in to the full card.
import { RoomSensorsCard } from "./card.js";
import { RS_AUTOS } from "./editor.js";
import { RS_I18N } from "./i18n/rs-i18n.js";

export class RoomSensorsMiniCard extends rcMini(
  RoomSensorsCard,
  "room-sensors-mini-card",
  `
    .r.icon { padding: 0 3px; }
    .r.icon ha-icon { margin-right: 0; }
    .r.on      { --t: var(--rc-warn); }
    .r.on.info { --t: var(--rc-info); }
    .r.na      { --t: var(--rc-na); opacity: .7; }
    .r.on:not(.info) ha-icon { animation: rc-blink 1.5s ease-in-out infinite; }
    .no-blink .r.on ha-icon { animation: none; }
    @media (prefers-reduced-motion: reduce) { .r.on ha-icon { animation: none; } }
  `,
  { alertsOnly: true },
) {
  _drawMini(items) {
    const v = this._visible(items, ["mini", items.map((i) => [i.id, i.on, i.unavailable, i.name, i.icon])]);
    if (!v) return;
    const { level, icon, status, shown } = v;
    const chips = shown
      .map((i) => {
        const cls = `${i.on ? " on pill" : " icon"}${i.info ? " info" : ""}${i.unavailable ? " na" : ""}`;
        return `
        <button class="r${cls}" data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
          <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${i.on ? `<span>${rcEsc(i.name)}</span>` : ""}
        </button>`;
      })
      .join("");
    this._paintMini({ level, icon, status, chips, cls: this._config.blink === false ? " no-blink" : "" });
  }
}

export const RoomSensorsMiniCardEditor = rcEditor({
  card: RoomSensorsMiniCard,
  helpers: ["title", "layout", "columns", "hide_when_clear", "presence", "outdoor", "zoom", "include", "names", ...RC_ADVANCED_HELPERS],
  autos: RS_AUTOS,
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RS_I18N, lang),
    ...rcBooleans("show_title", "hide_when_clear", "presence", "outdoor", "blink", "zoom"),
    ...rcIllustrationFields(RS_I18N, lang, true),
    ...rcIncludeField(RoomSensorsMiniCard, hass, config),
    ...rcExcludeField(RoomSensorsMiniCard, hass, config),
    ...rcRenameField(RoomSensorsMiniCard, hass, config),
    ...rcAdvanced(RS_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomSensorsMiniCard,
  RoomSensorsMiniCardEditor,
  "Room Sensors Mini Card",
  "The sensors of a room on two lines: open or detecting ones first, with a zoom to the full card",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then one chip per reading (icon and value), tinted only when
// the reading needs a look. The zoom button switches to the full Environment card (tiles and gauges) and back.
// `columns` and `show_gauge` only shape the zoomed-in view.
import { RoomEnvironmentCard } from "./card.js";
import { RE_I18N } from "./i18n/re-i18n.js";

export class RoomEnvironmentMiniCard extends rcMini(
  RoomEnvironmentCard,
  "room-environment-mini-card",
  `
    .r small { font-size: 10px; font-weight: 400; opacity: .7; margin-left: 1px; }
    .r.s-warn  { --t: var(--rc-warn); }
    .r.s-alert { --t: var(--rc-alert); }
    .r.cold    { --t: var(--rc-info); }
    .r.k-illuminance     { --t: var(--rc-idle); }
    .r.k-illuminance.lit { --t: var(--rc-light); }
    .r.na { --t: var(--rc-na); opacity: .7; }
  `,
) {
  _drawMini(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok";
    const na = this._naItem();
    if (!this._changed(["mini", items.map((i) => [i.id, i.icon, i.state, i.sev, i.cold]), na?.name, na?.state])) return;

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok") : items;
    this._shown = shown.length;
    // Comfortable readings stay plain; the ones needing a look get a tinted pill, cool ones in blue.
    const pill = (i) => i.sev === "warn" || i.sev === "alert" || (i.cold && i.sev !== "ok");
    const chips = shown
      .map(
        (i) => `
        <button class="r s-${i.sev}${i.cold ? " cold" : ""}${i.light ? " lit" : ""}${pill(i) ? " pill" : ""} k-${i.kind}"
                data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
          <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${this._chipValue(i)}
        </button>`,
      )
      .join("");
    const naChip = na
      ? `<button class="r na" data-id="${rcEsc(na.id)}" title="${rcEsc(na.name)} — ${rcEsc(na.state)}">
          <ha-icon icon="${rcEsc(na.icon)}"></ha-icon><span>${rcEsc(na.name)}</span>
        </button>`
      : "";
    this._paintMini({ level, icon: this._headIcon(worst), status: this._status(items, worst), chips: chips + naChip });
  }
}

export const RoomEnvironmentMiniCardEditor = rcEditor({
  card: RoomEnvironmentMiniCard,
  helpers: ["title", "navigation_path", "layout", "columns", "only_alerts", "show_gauge", "zoom", "include", "names", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    rcLayoutField(RE_I18N, lang),
    ...rcBooleans("show_title", "only_alerts", "zoom", "show_gauge", "show_history"),
    ...rcIllustrationFields(RE_I18N, lang, true),
    ...rcIncludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcExcludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcRenameField(RoomEnvironmentMiniCard, hass, config),
    ...rcAdvanced(RE_I18N, lang, "thresholds", "entities", "language"),
  ],
});

rcRegister(
  RoomEnvironmentMiniCard,
  RoomEnvironmentMiniCardEditor,
  "Room Environment Mini Card",
  "The environment readings of a room on a single line: one chip per reading, tinted when it needs a look",
);

/**
 * room-sensors-card — leak, door, window, opening and presence sensors of a Home Assistant area.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RS_I18N = {
  en: {
    title: "Sensors",
    all_closed: "All closed",
    all_quiet: "All quiet",
    open_one: "{n} open",
    open_many: "{n} open",
    leak: "Water leak",
    no_sensors: "No sensor",
    unavailable: "Unavailable",
    leak_on: "Leak!",
    leak_off: "Dry",
    open: "Open",
    closed: "Closed",
    presence_on: "Detected",
    presence_off: "Clear",
    motion_on: "Motion",
    motion_off: "Clear",
    occupied: "Presence detected",
    now: "just now",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} d",
    ed_area: "Area",
    ed_title: "Title",
    ed_title_helper: "Leave empty for the area name",
    ed_columns: "Columns",
    ed_only_alerts: "Hide idle sensors",
    ed_only_alerts_helper: "Only open, leaking or detecting sensors stay visible",
    ed_hide_when_clear: "Hide the card when idle",
    ed_hide_when_clear_helper: "The card only appears when a door or window is open, or a leak or presence is detected",
    ed_presence: "Include presence sensors",
    ed_presence_helper: "Presence and motion sensors, cameras excluded",
    ed_blink: "Blink alerts",
    ed_include: "Sensors to add",
    ed_include_helper: "From another room or without one",
    ed_exclude: "Sensors to exclude",
    err_config: "Set `area` or `entities`",
  },
  fr: {
    title: "Capteurs",
    all_closed: "Tout est fermé",
    all_quiet: "Tout est calme",
    open_one: "{n} ouverture",
    open_many: "{n} ouvertures",
    leak: "Fuite d'eau",
    no_sensors: "Aucun capteur",
    unavailable: "Indisponible",
    leak_on: "Fuite !",
    leak_off: "Sec",
    open: "Ouvert",
    closed: "Fermé",
    open_f: "Ouverte",
    closed_f: "Fermée",
    presence_on: "Détectée",
    presence_off: "Aucune",
    motion_on: "Mouvement",
    motion_off: "Calme",
    occupied: "Présence détectée",
    now: "à l'instant",
    min: "{n} min",
    hour: "{n} h",
    day: "{n} j",
    ed_area: "Pièce",
    ed_title: "Titre",
    ed_title_helper: "Laisser vide pour le nom de la pièce",
    ed_columns: "Colonnes",
    ed_only_alerts: "Masquer les capteurs au repos",
    ed_only_alerts_helper: "Seuls les capteurs ouverts, en fuite ou détectant une présence restent affichés",
    ed_hide_when_clear: "Masquer la carte au repos",
    ed_hide_when_clear_helper: "La carte n'apparaît que si une porte ou une fenêtre est ouverte, ou si une fuite ou une présence est détectée",
    ed_presence: "Inclure les capteurs de présence",
    ed_presence_helper: "Capteurs de présence et de mouvement, hors caméras",
    ed_blink: "Faire clignoter les alertes",
    ed_include: "Capteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce",
    ed_exclude: "Capteurs à exclure",
    err_config: "Définis `area` ou `entities`",
  },
};

// ── Sensor kinds ─────────────────────────────────────────────────────────────
// `fem`: the French state is feminine (porte, fenêtre).
// `info`: an active state that is not an alert (presence, motion).
const RS_KINDS = {
  leak: { on: "mdi:water-alert", off: "mdi:water-check" },
  slide: { on: "mdi:door-sliding-open", off: "mdi:door-sliding", fem: true },
  window: { on: "mdi:window-open-variant", off: "mdi:window-closed-variant", fem: true },
  garage: { on: "mdi:garage-open", off: "mdi:garage" },
  door: { on: "mdi:door-open", off: "mdi:door-closed", fem: true },
  opening: { on: "mdi:square-rounded-badge-outline", off: "mdi:square-rounded-outline" },
  presence: { on: "mdi:account", off: "mdi:account-outline", info: true },
  motion: { on: "mdi:motion-sensor", off: "mdi:motion-sensor-off", info: true },
};

const rsKindOf = (st) => {
  const dc = st.attributes.device_class;
  const id = st.entity_id;
  if (dc === "moisture") return "leak";
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
const RS_PREFIX = /^(capteur|sensor)\s+/i;
const RS_SUFFIX =
  /\s+(porte|ouverture|fuite d.eau|contact|door|window|opening|moisture|leak|occupation|occupancy|motion|mouvement)$/i;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomSensorsCard extends RcCard {
  static tag = "room-sensors-card";
  static i18n = RS_I18N;
  static needsArea = true;
  static includeDomains = ["binary_sensor"];
  static defaults = { columns: 2, only_alerts: false, hide_when_clear: false, presence: true, blink: true, exclude: [] };

  _candidate(id) {
    return rcMatchSensor(this._hass, id, { presence: this._config.presence, cameras: this._cameras });
  }

  _stateText(kind, on) {
    if (kind === "leak") return this._t(on ? "leak_on" : "leak_off");
    if (RS_KINDS[kind].info) return this._t(`${kind}_${on ? "on" : "off"}`);
    if (this._lang() === "fr" && RS_KINDS[kind].fem) return this._t(on ? "open_f" : "closed_f");
    return this._t(on ? "open" : "closed");
  }

  // Leaks first, then open doors and windows, then detected presence, then the rest.
  _rank(i) {
    if (!i.on) return 0;
    if (i.kind === "leak") return 3;
    return i.info ? 1 : 2;
  }

  _ago(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return this._t("now");
    if (s < 3600) return this._t("min", { n: Math.floor(s / 60) });
    if (s < 86400) return this._t("hour", { n: Math.floor(s / 3600) });
    return this._t("day", { n: Math.floor(s / 86400) });
  }

  _prepare() {
    this._cameras = rcCameraDevices(this._hass);
  }

  _collect() {
    const areaName = this._areaName();
    return this._entries()
      .map((e) => {
        const st = this._hass.states[e.entity];
        const kind = rsKindOf(st);
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        return {
          id: e.entity,
          kind,
          info: !!RS_KINDS[kind].info,
          on,
          unavailable,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RS_PREFIX, RS_SUFFIX),
          icon: e.icon ?? (on ? RS_KINDS[kind].on : RS_KINDS[kind].off),
          state: unavailable ? this._t("unavailable") : this._stateText(kind, on),
          since: st.last_changed,
        };
      })
      .sort((a, b) => this._rank(b) - this._rank(a) || a.name.localeCompare(b.name));
  }

  _draw(items) {
    const c = this._config;

    const leaks = items.filter((i) => i.kind === "leak" && i.on).length;
    const open = items.filter((i) => i.kind !== "leak" && !i.info && i.on).length;
    const occupied = items.some((i) => i.info && i.on);
    const level = leaks ? "alert" : open ? "warn" : "ok";

    // The "since" label moves every minute.
    if (!this._changed(items.map((i) => [i.id, i.on, i.unavailable, i.name, i.on ? this._ago(i.since) : ""]))) return;
    // Hidden only when nothing needs a look: everything closed and dry, and no presence.
    if (this._hide(c.hide_when_clear && level === "ok" && !occupied)) return;

    const status = leaks
      ? this._t("leak")
      : open
        ? this._t(open > 1 ? "open_many" : "open_one", { n: open })
        : // "All closed" only makes sense with door or window sensors.
          this._t(items.some((i) => i.kind !== "leak" && !i.info) ? "all_closed" : items.length ? "all_quiet" : "no_sensors");
    const shown = c.only_alerts ? items.filter((i) => i.on || i.unavailable) : items;
    const tiles = shown
      .map((i) =>
        this._tile(i, {
          cls: `${i.kind === "leak" ? " leak" : ""}${i.info ? " info" : ""}`,
          state: `${rcEsc(i.state)}${i.on ? ` · <span class="since">${rcEsc(this._ago(i.since))}</span>` : ""}`,
        }),
      )
      .join("");
    const chips = occupied
      ? `<div class="chip" title="${rcEsc(this._t("occupied"))}"><ha-icon icon="mdi:account"></ha-icon></div>`
      : "";
    const head = this._head({
      icon: leaks ? "mdi:water-alert" : open ? "mdi:shield-alert-outline" : "mdi:shield-home-outline",
      title: c.title || this._areaName() || this._t("title"),
      status,
      chips,
    });
    this._paint(level, head, tiles, c.blink === false ? " no-blink" : "");
  }

  // A tap opens the details: a sensor cannot be toggled.
  _bindTile(el) {
    el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
  }

  static styles = `
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }
    .chip { flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
            color: var(--rc-info); background: color-mix(in srgb, var(--rc-info) 14%, transparent); }
    .chip ha-icon { --mdc-icon-size: 13px; }
    .tile { --t: var(--rc-ok); }
    .tile.on      { --t: var(--rc-warn); }
    .tile.on.leak { --t: var(--rc-alert); }
    .tile.on.info { --t: var(--rc-info); }
    .tile:not(.off) .state { color: var(--t); }
    .tile.on:not(.info) .ic { animation: rc-blink 1.5s ease-in-out infinite; }
    .since { opacity: .8; }
    .no-blink .tile.on .ic, .no-blink.lvl-alert .badge { animation: none; }
    @media (prefers-reduced-motion: reduce) { .tile.on .ic { animation: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomSensorsCardEditor = rcEditor({
  i18n: RS_I18N,
  defaults: { columns: 2, only_alerts: false, hide_when_clear: false, presence: true, blink: true },
  helpers: ["title", "only_alerts", "hide_when_clear", "presence", "include"],
  schema: (_lang, hass, config) => [
    ...rcAreaFields(false),
    ...rcBooleans("only_alerts", "hide_when_clear", "presence", "blink"),
    ...rcIncludeField(RoomSensorsCard, hass, config),
    ...rcExcludeField(RoomSensorsCard, hass, config),
  ],
});

rcRegister(
  RoomSensorsCard,
  RoomSensorsCardEditor,
  "Room Sensors Card",
  "Leak, door, window, opening and presence sensors of a room, open ones first",
);

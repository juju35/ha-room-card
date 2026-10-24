/**
 * room-switch-card — smart plugs of a Home Assistant area with their power draw.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RW_I18N = {
  en: {
    title: "Plugs",
    all_off: "All off",
    on_one: "{n} on",
    on_many: "{n} on",
    no_plugs: "No plug",
    unavailable: "Unavailable",
    on: "On",
    off: "Off",
    turn_all_off: "Turn everything off",
    ed_area: "Area",
    ed_title: "Title",
    ed_title_helper: "Leave empty for the area name",
    ed_columns: "Columns",
    ed_navigation_path: "Navigation path",
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /energy",
    ed_only_on: "Hide plugs that are off",
    ed_only_on_helper: "Only the plugs that are on stay visible",
    ed_hide_when_off: "Hide the card when everything is off",
    ed_hide_when_off_helper: "The card only appears when a plug is on",
    ed_show_power: "Show power draw",
    ed_show_power_helper: "Read from the power sensor of each plug",
    ed_all_off_button: "“Turn everything off” button",
    ed_all_off_button_helper: "Tapping the status pill turns every plug of the card off",
    ed_include: "Plugs and switches to add",
    ed_include_helper: "From another room or without one, or a switch not recognised as a plug",
    ed_exclude: "Plugs to exclude",
    err_config: "Set `area` or `entities`",
  },
  fr: {
    title: "Prises",
    all_off: "Tout est éteint",
    on_one: "{n} allumée",
    on_many: "{n} allumées",
    no_plugs: "Aucune prise",
    unavailable: "Indisponible",
    on: "Allumée",
    off: "Éteinte",
    turn_all_off: "Tout éteindre",
    ed_area: "Pièce",
    ed_title: "Titre",
    ed_title_helper: "Laisser vide pour le nom de la pièce",
    ed_columns: "Colonnes",
    ed_navigation_path: "Chemin de navigation",
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /energy",
    ed_only_on: "Masquer les prises éteintes",
    ed_only_on_helper: "Seules les prises allumées restent affichées",
    ed_hide_when_off: "Masquer la carte quand tout est éteint",
    ed_hide_when_off_helper: "La carte n'apparaît que si une prise est allumée",
    ed_show_power: "Afficher la consommation",
    ed_show_power_helper: "Lue sur le capteur de puissance de chaque prise",
    ed_all_off_button: "Bouton « Tout éteindre »",
    ed_all_off_button_helper: "Un tap sur la pastille éteint toutes les prises de la carte",
    ed_include: "Prises et interrupteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce, ou un interrupteur non reconnu comme prise",
    ed_exclude: "Prises à exclure",
    err_config: "Définis `area` ou `entities`",
  },
};

// "Prise Machine à café" → "Machine à café", "Coffee Machine Plug" → "Coffee Machine",
// "Prise Caméra Terrasse" in Terrasse → "Caméra"
const RW_PREFIX = /^(prise|multiprise|plug|smart plug|outlet)\s+/i;
const RW_SUFFIX = /\s+(prise|plug|smart plug|outlet|socket)$/i;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomSwitchCard extends RcCard {
  static tag = "room-switch-card";
  static i18n = RW_I18N;
  static needsArea = true;
  static includeDomains = ["switch"];
  static defaults = {
    columns: 2,
    only_on: false,
    hide_when_off: false,
    show_power: true,
    all_off_button: false,
    exclude: [],
  };

  _candidate(id) {
    return rcMatchPlug(this._hass, id);
  }

  _collect() {
    const h = this._hass;
    const areaName = this._areaName();
    const power = rcPowerSensors(h);
    return this._entries()
      .map((e) => {
        const st = h.states[e.entity];
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        const watts = this._config.show_power ? rcWattsOf(h, e.power ?? power[h.entities?.[e.entity]?.device_id]) : null;
        const item = {
          id: e.entity,
          on,
          unavailable,
          watts,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RW_PREFIX, RW_SUFFIX),
          icon:
            e.icon ??
            h.entities?.[e.entity]?.icon ??
            st.attributes.icon ??
            (on ? "mdi:power-socket-fr" : "mdi:power-plug-off-outline"),
        };
        item.state = unavailable
          ? this._t("unavailable")
          : `${this._t(on ? "on" : "off")}${on && watts != null ? ` · ${rcWatts(watts)}` : ""}`;
        return item;
      })
      .sort((a, b) => b.on - a.on || (b.watts ?? -1) - (a.watts ?? -1) || a.name.localeCompare(b.name));
  }

  _draw(items) {
    const c = this._config;
    const lit = items.filter((i) => i.on);
    const level = lit.length ? "on" : "off";
    const total = lit.reduce((t, i) => t + (i.watts ?? 0), 0);

    if (!this._changed(items.map((i) => [i.id, i.on, i.unavailable, i.watts == null ? null : Math.round(i.watts), i.name, i.icon]))) {
      return;
    }
    if (this._hide(c.hide_when_off && level === "off")) return;

    let status = lit.length
      ? this._t(lit.length > 1 ? "on_many" : "on_one", { n: lit.length })
      : this._t(items.length ? "all_off" : "no_plugs");
    if (lit.some((i) => i.watts != null)) status += ` · ${rcWatts(total)}`;
    const shown = c.only_on ? items.filter((i) => i.on || i.unavailable) : items;
    const head = this._head({
      icon: lit.length ? "mdi:power-socket-fr" : "mdi:power-plug-off-outline",
      title: c.title || this._areaName() || this._t("title"),
      status,
      allOff: c.all_off_button && lit.length > 0,
    });
    this._paint(level, head, shown.map((i) => this._tile(i, { state: rcEsc(i.state) })).join(""));
  }

  static styles = `
    ha-card.lvl-on  { --c: var(--rc-plug); }
    ha-card.lvl-off { --c: var(--rc-idle); }
    .tile { --t: var(--rc-plug); }
    .tile.off { --t: var(--rc-idle); }
    .tile.off .ic { background: color-mix(in srgb, var(--t) 12%, transparent); }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomSwitchCardEditor = rcEditor({
  i18n: RW_I18N,
  defaults: { columns: 2, only_on: false, hide_when_off: false, show_power: true, all_off_button: false },
  helpers: ["title", "navigation_path", "only_on", "hide_when_off", "show_power", "all_off_button", "include"],
  schema: (_lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_on", "hide_when_off", "show_power", "all_off_button"),
    ...rcIncludeField(RoomSwitchCard, hass, config),
    ...rcExcludeField(RoomSwitchCard, hass, config),
  ],
});

rcRegister(
  RoomSwitchCard,
  RoomSwitchCardEditor,
  "Room Switch Card",
  "Smart plugs of a room with their power draw: tap to toggle, hold for details",
);

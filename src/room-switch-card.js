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
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /energy",
    ed_only_on: "Hide plugs that are off",
    ed_only_on_helper: "Only the plugs that are on stay visible",
    ed_hide_when_off: "Hide the card when everything is off",
    ed_hide_when_off_helper: "The card only appears when a plug is on",
    ed_show_power: "Show power draw",
    ed_show_power_helper: "Read from the power sensor of each plug",
    ed_all_off_button_helper: "Tapping the status pill turns every plug of the card off",
    ed_include: "Plugs and switches to add",
    ed_include_helper: "From another room or without one, or a switch not recognised as a plug",
    ed_exclude: "Plugs to exclude",
  },
  fr: {
    title: "Prises",
    all_off: "Tout est éteint",
    on_one: "{n} allumée",
    on_many: "{n} allumées",
    no_plugs: "Aucune prise",
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /energy",
    ed_only_on: "Masquer les prises éteintes",
    ed_only_on_helper: "Seules les prises allumées restent affichées",
    ed_hide_when_off: "Masquer la carte quand tout est éteint",
    ed_hide_when_off_helper: "La carte n'apparaît que si une prise est allumée",
    ed_show_power: "Afficher la consommation",
    ed_show_power_helper: "Lue sur le capteur de puissance de chaque prise",
    ed_all_off_button_helper: "Un tap sur la pastille éteint toutes les prises de la carte",
    ed_include: "Prises et interrupteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce, ou un interrupteur non reconnu comme prise",
    ed_exclude: "Prises à exclure",
  },
  de: {
    title: "Steckdosen",
    all_off: "Alles aus",
    on_one: "{n} an",
    on_many: "{n} an",
    no_plugs: "Keine Steckdose",
    ed_navigation_path_helper: "Dashboard, das beim Tippen auf den Titel geöffnet wird, z. B. /energy",
    ed_only_on: "Ausgeschaltete Steckdosen ausblenden",
    ed_only_on_helper: "Nur eingeschaltete Steckdosen bleiben sichtbar",
    ed_hide_when_off: "Karte ausblenden, wenn alles aus ist",
    ed_hide_when_off_helper: "Die Karte erscheint nur, wenn eine Steckdose an ist",
    ed_show_power: "Leistungsaufnahme anzeigen",
    ed_show_power_helper: "Vom Leistungssensor jeder Steckdose gelesen",
    ed_all_off_button_helper: "Tippen auf die Statusanzeige schaltet alle Steckdosen der Karte aus",
    ed_include: "Hinzuzufügende Steckdosen und Schalter",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum, oder ein Schalter, der nicht als Steckdose erkannt wird",
    ed_exclude: "Auszuschließende Steckdosen",
  },
  es: {
    title: "Enchufes",
    all_off: "Todo apagado",
    on_one: "{n} encendido",
    on_many: "{n} encendidos",
    no_plugs: "Ningún enchufe",
    ed_navigation_path_helper: "Panel que se abre al tocar el título, p. ej. /energy",
    ed_only_on: "Ocultar los enchufes apagados",
    ed_only_on_helper: "Solo quedan visibles los enchufes encendidos",
    ed_hide_when_off: "Ocultar la tarjeta cuando todo está apagado",
    ed_hide_when_off_helper: "La tarjeta solo aparece cuando hay un enchufe encendido",
    ed_show_power: "Mostrar el consumo",
    ed_show_power_helper: "Leído del sensor de potencia de cada enchufe",
    ed_all_off_button_helper: "Al tocar el indicador de estado se apagan todos los enchufes de la tarjeta",
    ed_include: "Enchufes e interruptores a añadir",
    ed_include_helper: "De otra habitación o sin habitación, o un interruptor no reconocido como enchufe",
    ed_exclude: "Enchufes a excluir",
  },
};

// "Prise Machine à café" → "Machine à café", "Coffee Machine Plug" → "Coffee Machine",
// "Prise Caméra Terrasse" in Terrasse → "Caméra"
const RW_PREFIX = /^(prise|multiprise|plug|smart plug|outlet)\s+/i;
const RW_SUFFIX = /\s+(prise|plug|smart plug|outlet|socket)$/i;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomSwitchCard extends RcToggleCard {
  static tag = "room-switch-card";
  static i18n = RW_I18N;
  static needsArea = true;
  static includeDomains = ["switch"];
  static headIcons = ["mdi:power-socket-fr", "mdi:power-plug-off-outline"];
  static emptyKey = "no_plugs";
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

  _sigOf(i) {
    return [i.id, i.on, i.unavailable, i.watts == null ? null : Math.round(i.watts), i.name, i.icon];
  }

  _tileOf(i) {
    return this._tile(i, { state: rcEsc(i.state) });
  }

  // Total power of the plugs that are on, when at least one of them reports it.
  _statusExtra(lit) {
    if (!lit.some((i) => i.watts != null)) return "";
    return ` · ${rcWatts(lit.reduce((t, i) => t + (i.watts ?? 0), 0))}`;
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
  card: RoomSwitchCard,
  helpers: ["title", "navigation_path", "only_on", "hide_when_off", "show_power", "all_off_button", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_on", "hide_when_off", "show_power", "all_off_button"),
    ...rcIncludeField(RoomSwitchCard, hass, config),
    ...rcExcludeField(RoomSwitchCard, hass, config),
    ...rcAdvanced(RW_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomSwitchCard,
  RoomSwitchCardEditor,
  "Room Switch Card",
  "Smart plugs of a room with their power draw: tap to toggle, hold for details",
);

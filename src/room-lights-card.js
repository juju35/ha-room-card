/**
 * room-lights-card — lights of a Home Assistant area: tap to toggle, drag to dim, hold for details.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RL_I18N = {
  en: {
    title: "Lights",
    // Light tiles: feminine where "light" is ("1 encendida" / "Encendida · 50 %").
    on: "On",
    off: "Off",
    all_off: "All off",
    on_one: "{n} on",
    on_many: "{n} on",
    no_lights: "No light",
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /light",
    ed_only_on: "Hide lights that are off",
    ed_only_on_helper: "Only the lights that are on stay visible",
    ed_hide_when_off: "Hide the card when everything is off",
    ed_hide_when_off_helper: "The card only appears when a light is on",
    ed_show_brightness: "Show and adjust brightness",
    ed_show_brightness_helper: "Drag a light sideways to set its brightness",
    ed_all_off_button_helper: "Tapping the status pill turns every light of the card off",
    ed_include: "Lights to add",
    ed_include_helper: "From another room or without one",
    ed_exclude: "Lights to exclude",
  },
  fr: {
    title: "Lumières",
    on: "Allumée",
    off: "Éteinte",
    all_off: "Tout est éteint",
    on_one: "{n} allumée",
    on_many: "{n} allumées",
    no_lights: "Aucune lumière",
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /light",
    ed_only_on: "Masquer les lumières éteintes",
    ed_only_on_helper: "Seules les lumières allumées restent affichées",
    ed_hide_when_off: "Masquer la carte quand tout est éteint",
    ed_hide_when_off_helper: "La carte n'apparaît que si une lumière est allumée",
    ed_show_brightness: "Afficher et régler la luminosité",
    ed_show_brightness_helper: "Glisser une lumière sur le côté pour régler sa luminosité",
    ed_all_off_button_helper: "Un tap sur la pastille éteint toutes les lumières de la carte",
    ed_include: "Lumières à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce",
    ed_exclude: "Lumières à exclure",
  },
  de: {
    title: "Lichter",
    on: "An",
    off: "Aus",
    all_off: "Alles aus",
    on_one: "{n} an",
    on_many: "{n} an",
    no_lights: "Kein Licht",
    ed_navigation_path_helper: "Dashboard, das beim Tippen auf den Titel geöffnet wird, z. B. /light",
    ed_only_on: "Ausgeschaltete Lichter ausblenden",
    ed_only_on_helper: "Nur eingeschaltete Lichter bleiben sichtbar",
    ed_hide_when_off: "Karte ausblenden, wenn alles aus ist",
    ed_hide_when_off_helper: "Die Karte erscheint nur, wenn ein Licht an ist",
    ed_show_brightness: "Helligkeit anzeigen und einstellen",
    ed_show_brightness_helper: "Ziehe ein Licht seitwärts, um seine Helligkeit einzustellen",
    ed_all_off_button_helper: "Tippen auf die Statusanzeige schaltet alle Lichter der Karte aus",
    ed_include: "Hinzuzufügende Lichter",
    ed_include_helper: "Aus einem anderen Raum oder ohne Raum",
    ed_exclude: "Auszuschließende Lichter",
  },
  es: {
    title: "Luces",
    on: "Encendida",
    off: "Apagada",
    all_off: "Todo apagado",
    on_one: "{n} encendida",
    on_many: "{n} encendidas",
    no_lights: "Ninguna luz",
    ed_navigation_path_helper: "Panel que se abre al tocar el título, p. ej. /light",
    ed_only_on: "Ocultar las luces apagadas",
    ed_only_on_helper: "Solo quedan visibles las luces encendidas",
    ed_hide_when_off: "Ocultar la tarjeta cuando todo está apagado",
    ed_hide_when_off_helper: "La tarjeta solo aparece cuando hay una luz encendida",
    ed_show_brightness: "Mostrar y ajustar el brillo",
    ed_show_brightness_helper: "Desliza una luz hacia un lado para ajustar su brillo",
    ed_all_off_button_helper: "Al tocar el indicador de estado se apagan todas las luces de la tarjeta",
    ed_include: "Luces a añadir",
    ed_include_helper: "De otra habitación o sin habitación",
    ed_exclude: "Luces a excluir",
  },
};

// "Lumière Canapé" → "Canapé", "Séjour Veilleuse" in Séjour → "Veilleuse"
const RL_PREFIX = /^(lumi[eè]re|lampe|light|lamp)\s+/i;
const RL_SUFFIX = /$^/;

// Brightness can be set unless the light only supports on/off.
const rlDimmable = (st) =>
  st.entity_id.startsWith("light.") && (st.attributes.supported_color_modes || []).some((m) => m !== "onoff");

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomLightsCard extends RcToggleCard {
  static tag = "room-lights-card";
  static i18n = RL_I18N;
  static needsArea = true;
  static includeDomains = ["light", "switch"];
  static headIcons = ["mdi:lightbulb-group", "mdi:lightbulb-group-off-outline"];
  static emptyKey = "no_lights";
  static defaults = {
    columns: 2,
    only_on: false,
    hide_when_off: false,
    show_brightness: true,
    all_off_button: true,
    exclude: [],
  };

  _candidate(id) {
    return rcMatchLight(this._hass, id);
  }

  _collect() {
    const h = this._hass;
    const areaName = this._areaName();
    return this._entries()
      .map((e) => {
        const st = h.states[e.entity];
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        const pct = on && st.attributes.brightness != null ? Math.round((st.attributes.brightness / 255) * 100) : null;
        const rgb = on ? st.attributes.rgb_color : null;
        const item = {
          id: e.entity,
          on,
          unavailable,
          dimmable: rlDimmable(st),
          pct,
          color: rgb ? `rgb(${rgb.join(",")})` : null,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RL_PREFIX, RL_SUFFIX),
          icon:
            e.icon ?? h.entities?.[e.entity]?.icon ?? st.attributes.icon ?? (on ? "mdi:lightbulb" : "mdi:lightbulb-outline"),
        };
        item.state = this._stateText(item);
        return item;
      })
      .sort((a, b) => b.on - a.on || a.name.localeCompare(b.name));
  }

  _stateText(i) {
    if (i.unavailable) return this._t("unavailable");
    if (!i.on) return this._t("off");
    return i.pct != null ? `${this._t("on")} · ${i.pct} %` : this._t("on");
  }

  _sigOf(i) {
    return [i.id, i.on, i.unavailable, i.pct, i.color, i.name, i.icon];
  }

  _tileOf(i) {
    return this._tile(i, {
      style: i.color ? `--t:${i.color}` : "",
      extra:
        this._config.show_brightness && i.dimmable && i.on
          ? `<span class="bar" style="width:${i.pct ?? 100}%"></span>`
          : "",
      state: rcEsc(i.state),
    });
  }

  // Tap: toggle · hold: more-info · horizontal drag on a dimmable light: brightness.
  _bindTile(el, item) {
    const pctAt = (x) => {
      const r = el.getBoundingClientRect();
      return Math.min(100, Math.max(1, Math.round(((x - r.left) / r.width) * 100)));
    };
    const show = (pct) => {
      let bar = el.querySelector(".bar");
      if (!bar) {
        bar = document.createElement("span");
        bar.className = "bar";
        el.prepend(bar);
      }
      bar.style.width = `${pct}%`;
      el.querySelector(".state").textContent = `${this._t("on")} · ${pct} %`;
    };
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: item.id }),
      onHold: () => rcMoreInfo(this, item.id),
      drag:
        this._config.show_brightness && item?.dimmable
          ? {
              move: (x) => show(pctAt(x)),
              end: (x) => rcCall(this._hass, "light", "turn_on", { entity_id: item.id, brightness_pct: pctAt(x) }),
            }
          : null,
    });
  }

  static styles = `
    ha-card.lvl-on  { --c: var(--rc-light); }
    ha-card.lvl-off { --c: var(--rc-idle); }
    .tile { --t: var(--rc-light); }
    .tile.off { --t: var(--rc-idle); }
    .tile.off .ic { background: color-mix(in srgb, var(--t) 12%, transparent); }
    .bar { position: absolute; inset: 0 auto 0 0; pointer-events: none;
           background: color-mix(in srgb, var(--t) 14%, transparent); transition: width .2s; }
    .tile.dragging .bar { transition: none; }
    @media (prefers-reduced-motion: reduce) { .bar { transition: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomLightsCardEditor = rcEditor({
  card: RoomLightsCard,
  helpers: ["title", "navigation_path", "only_on", "hide_when_off", "show_brightness", "all_off_button", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_on", "hide_when_off", "show_brightness", "all_off_button"),
    ...rcIncludeField(RoomLightsCard, hass, config),
    ...rcExcludeField(RoomLightsCard, hass, config),
    ...rcAdvanced(RL_I18N, lang, "entities", "language"),
  ],
});

rcRegister(
  RoomLightsCard,
  RoomLightsCardEditor,
  "Room Lights Card",
  "Lights of a room: tap to toggle, drag to dim, turn everything off from the header",
);

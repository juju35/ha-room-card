/**
 * Shared by the room cards (its names are used by the other src/ files): discovery rules, i18n helpers, the base card (header, tiles,
 * tap / hold / drag), the visual editor and the common styles.
 * https://github.com/juju35/ha-room-card
 */
const RC_VERSION = "__VERSION__";

// ── Discovery rules ──────────────────────────────────────────────────────────
const RC_OPENING_CLASSES = ["moisture", "door", "window", "opening", "garage_door"];
const RC_PRESENCE_CLASSES = ["occupancy", "presence", "motion"];
// A switch driving a light belongs to the lights card, a switch that is a plug to the plugs card.
const RC_LIGHT_NAME = /(^|\s)(lumi[eè]re|lampe|lamp|light|veilleuse|guirlande)(\s|$)/i;
const RC_PLUG_NAME = /(^|\s)(prise|multiprise|plug|outlet|socket)(\s|$)/i;
const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;

const rcIsLightSwitch = (st) => RC_LIGHT_NAME.test(st.attributes.friendly_name || "");
const rcIsPlug = (st) =>
  !rcIsLightSwitch(st) && (st.attributes.device_class === "outlet" || RC_PLUG_NAME.test(st.attributes.friendly_name || ""));

// What each room card shows, shared with the Overview so that both count the same entities.
// Sensors card: leak, door, window and opening sensors, plus presence and motion unless `presence` is false
// (the devices in `cameras` excepted).
const rcMatchSensor = (hass, id, { presence = true, cameras = new Set() } = {}) => {
  if (!id.startsWith("binary_sensor.")) return false;
  const dc = hass.states[id]?.attributes.device_class;
  if (RC_OPENING_CLASSES.includes(dc)) return true;
  if (presence === false || !RC_PRESENCE_CLASSES.includes(dc)) return false;
  return !cameras.has(hass.entities?.[id]?.device_id);
};
// Lights card: lights (groups excepted) and switches driving a light, configuration and diagnostic entities excepted.
const rcMatchLight = (hass, id) => {
  const st = hass.states[id];
  if (!st || hass.entities?.[id]?.entity_category) return false;
  if (id.startsWith("light.")) return !Array.isArray(st.attributes.entity_id);
  return id.startsWith("switch.") && rcIsLightSwitch(st);
};
// Plugs card: switches that are plugs, configuration and diagnostic entities excepted.
const rcMatchPlug = (hass, id) => {
  const st = hass.states[id];
  if (!st || !id.startsWith("switch.") || hass.entities?.[id]?.entity_category) return false;
  return rcIsPlug(st);
};

const RC_ROOM_ICONS = [
  [/chambre|bedroom|nursery/i, "mdi:bed-outline"],
  [/s[ée]jour|salon|living|lounge/i, "mdi:sofa-outline"],
  [/cuisine|kitchen/i, "mdi:silverware-fork-knife"],
  [/salle (de )?bains?|bath|douche|shower/i, "mdi:shower-head"],
  [/toilettes?|wc|toilet/i, "mdi:toilet"],
  [/entr[ée]e|entrance|hall d.entr|entry/i, "mdi:door"],
  [/couloir|hall|corridor/i, "mdi:arrow-left-right"],
  [/bureau|office|study/i, "mdi:desk"],
  [/garage/i, "mdi:garage"],
  [/terrasse|jardin|balcon|garden|terrace|balcony|patio|ext[ée]rieur|outdoor/i, "mdi:flower-outline"],
  [/buanderie|cellier|laundry|utility/i, "mdi:washing-machine"],
  [/salle [àa] manger|dining/i, "mdi:table-chair"],
];

// Icon of a room in the overviews: the area's own icon, or one picked from its name.
const rcRoomIcon = (area) => {
  if (area.icon) return area.icon;
  const hit = RC_ROOM_ICONS.find(([re]) => re.test(area.name || area.area_id || ""));
  return hit ? hit[1] : "mdi:home-outline";
};

// `fn(hass)` computed once per entity registry: HA replaces hass.entities only when the registry changes,
// whereas a new hass (and hass.states) comes with every state change of the whole instance.
const rcPerRegistry = (fn) => {
  const cache = new WeakMap();
  const none = {};
  return (hass) => {
    const reg = hass.entities || none;
    if (!cache.has(reg)) cache.set(reg, fn(hass));
    return cache.get(reg);
  };
};

// Devices with a camera entity: their motion and person detections are left out.
const rcCameraDevices = rcPerRegistry(
  (hass) =>
    new Set(
      Object.entries(hass.entities || {})
        .filter(([id, r]) => id.startsWith("camera.") && r.device_id)
        .map(([, r]) => r.device_id),
    ),
);

// The sensor entities of each device, in registry order.
const rcDeviceSensors = rcPerRegistry((hass) => {
  const out = {};
  for (const [id, r] of Object.entries(hass.entities || {})) {
    if (r.device_id && id.startsWith("sensor.")) (out[r.device_id] ||= []).push(id);
  }
  return out;
});

// Power sensor (device class power, W or kW) of each device; only the device's own sensors are read.
// Settled per registry like rcDeviceSensors (a device_class next to never changes), except for the devices with a
// sensor that has no state yet (an integration still loading after a restart): those are looked at again on every
// call until all their sensors report, so their power sensor is not missed until the next registry change.
const rcPowerCache = rcPerRegistry((hass) => ({ found: {}, pending: new Set(Object.keys(rcDeviceSensors(hass))) }));
const rcPowerSensors = (hass) => {
  const cache = rcPowerCache(hass);
  if (!cache.pending.size) return cache.found;
  const sensors = rcDeviceSensors(hass);
  for (const device of cache.pending) {
    const ids = sensors[device] || [];
    const id = ids.find((s) => hass.states[s]?.attributes.device_class === "power");
    if (id) cache.found[device] = id;
    if (id || ids.every((s) => hass.states[s])) cache.pending.delete(device);
  }
  return cache.found;
};

const rcWattsOf = (hass, sensorId) => {
  const st = sensorId && hass.states[sensorId];
  const v = st ? Number.parseFloat(st.state) : Number.NaN;
  if (!Number.isFinite(v)) return null;
  return st.attributes.unit_of_measurement === "kW" ? v * 1000 : v;
};

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// Visible entities accepted by `match(id)`, with their area, minus the config's `exclude`: the registries are
// scanned again only when they or the config change.
const rcByArea = (card, match) => {
  const h = card._hass;
  const c = card._config;
  return rcMemo((card._memo ||= {}), "byArea", [c, h.entities, h.devices], () => {
    const excluded = new Set(c.exclude || []);
    const out = [];
    for (const [id, r] of Object.entries(h.entities || {})) {
      if (r.hidden || excluded.has(id) || !match(id)) continue;
      const aid = card._areaOf(id);
      if (aid) out.push([id, aid]);
    }
    return out;
  });
};

// Rooms in the order of the config's `rooms` list, then, with `sort: state`, the highest `rank(room)` first,
// then by name.
const rcSortRooms = (list, config, rank) => {
  const order = (config.rooms || []).map((x) => x.area);
  return list.sort((a, b) => {
    if (order.length) {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia !== ib) return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
    }
    return (config.sort === "state" ? rank(b) - rank(a) : 0) || a.name.localeCompare(b.name);
  });
};

// The overviews only show the rooms needing a look until their detail button (`zoom`, on by default) is pressed;
// `zoom: false` shows every room, with no button.
const rcCompact = (card) => card._config.zoom !== false && !card._zoomed;

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// The detail button of an overview header, at its end.
const rcZoomButton = (card) =>
  card._config.zoom === false
    ? ""
    : `<button class="zoom" title="${rcEsc(card._t(card._zoomed ? "rooms_check" : "rooms_all"))}"><ha-icon icon="${rcZoomIcon(card)}"></ha-icon></button>`;

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus();
  return true;
};

// Editor fields shared by the overviews: title, columns and sort.
const rcOverviewFields = (i18n, lang) => [
  { name: "title", selector: { text: {} } },
  { name: "columns", selector: { number: { min: 1, max: 6, mode: "box" } } },
  {
    name: "sort",
    selector: {
      select: {
        mode: "dropdown",
        options: ["name", "state"].map((value) => ({ value, label: rcT(i18n, lang, `ed_sort_${value}`) })),
      },
    },
  },
];

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    all_closed: "All closed",
    all_quiet: "All quiet",
    open_one: "{n} open",
    open_many: "{n} open",
    leak: "Water leak",
    unavailable: "Unavailable",
    on: "On",
    off: "Off",
    turn_all_off: "Turn everything off",
    ed_area: "Area",
    ed_title: "Title",
    ed_title_helper: "Leave empty for the area name",
    ed_columns: "Columns",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_entities: "Explicit entities (YAML)",
    ed_entities_helper: "Replaces the automatic discovery: entity IDs, or {entity, name, icon}",
    ed_thresholds: "Comfort thresholds (YAML)",
    ed_thresholds_helper: "Per kind, in the sensor's unit, e.g. co2: [800, 1200] or humidity: [25, 35, 70, 80]",
    ed_rooms: "Rooms (YAML)",
    ed_rooms_helper: "Order and overrides: a list of {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigation path",
    ed_all_off_button: "“Turn everything off” button",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
    rooms_all: "Show every room",
    rooms_check: "Only the rooms needing a look",
    ed_sort: "Sort",
    ed_sort_name: "By name",
    ed_exclude_areas: "Rooms to exclude",
  },
  fr: {
    all_closed: "Tout est fermé",
    all_quiet: "Tout est calme",
    open_one: "{n} ouverture",
    open_many: "{n} ouvertures",
    leak: "Fuite d'eau",
    unavailable: "Indisponible",
    on: "Allumée",
    off: "Éteinte",
    turn_all_off: "Tout éteindre",
    ed_area: "Pièce",
    ed_title: "Titre",
    ed_title_helper: "Laisser vide pour le nom de la pièce",
    ed_columns: "Colonnes",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_entities: "Entités explicites (YAML)",
    ed_entities_helper: "Remplace la découverte automatique : des identifiants d'entités, ou {entity, name, icon}",
    ed_thresholds: "Seuils de confort (YAML)",
    ed_thresholds_helper: "Par type, dans l'unité du capteur, par exemple co2: [800, 1200] ou humidity: [25, 35, 70, 80]",
    ed_rooms: "Pièces (YAML)",
    ed_rooms_helper: "Ordre et personnalisation : une liste de {area, name, icon, navigation_path}",
    ed_navigation_path: "Chemin de navigation",
    ed_all_off_button: "Bouton « Tout éteindre »",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
    rooms_all: "Afficher toutes les pièces",
    rooms_check: "Seulement les pièces à surveiller",
    ed_sort: "Tri",
    ed_sort_name: "Par nom",
    ed_exclude_areas: "Pièces à exclure",
  },
  de: {
    all_closed: "Alles geschlossen",
    all_quiet: "Alles ruhig",
    open_one: "{n} offen",
    open_many: "{n} offen",
    leak: "Wasserleck",
    unavailable: "Nicht verfügbar",
    on: "An",
    off: "Aus",
    turn_all_off: "Alles ausschalten",
    ed_area: "Bereich",
    ed_title: "Titel",
    ed_title_helper: "Leer lassen für den Namen des Bereichs",
    ed_columns: "Spalten",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_entities: "Explizite Entitäten (YAML)",
    ed_entities_helper: "Ersetzt die automatische Erkennung: Entitäts-IDs oder {entity, name, icon}",
    ed_thresholds: "Komfortschwellen (YAML)",
    ed_thresholds_helper: "Pro Art, in der Einheit des Sensors, z. B. co2: [800, 1200] oder humidity: [25, 35, 70, 80]",
    ed_rooms: "Räume (YAML)",
    ed_rooms_helper: "Reihenfolge und Anpassungen: eine Liste von {area, name, icon, navigation_path}",
    ed_navigation_path: "Navigationspfad",
    ed_all_off_button: "Schaltfläche „Alles ausschalten“",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
    rooms_all: "Alle Räume anzeigen",
    rooms_check: "Nur die Räume, die Aufmerksamkeit brauchen",
    ed_sort: "Sortierung",
    ed_sort_name: "Nach Name",
    ed_exclude_areas: "Auszuschließende Räume",
  },
  es: {
    all_closed: "Todo cerrado",
    all_quiet: "Todo tranquilo",
    open_one: "{n} abierto",
    open_many: "{n} abiertos",
    leak: "Fuga de agua",
    unavailable: "No disponible",
    on: "Encendido",
    off: "Apagado",
    turn_all_off: "Apagar todo",
    ed_area: "Área",
    ed_title: "Título",
    ed_title_helper: "Déjalo vacío para usar el nombre del área",
    ed_columns: "Columnas",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_entities: "Entidades explícitas (YAML)",
    ed_entities_helper: "Sustituye la detección automática: IDs de entidad, o {entity, name, icon}",
    ed_thresholds: "Umbrales de confort (YAML)",
    ed_thresholds_helper: "Por tipo, en la unidad del sensor, p. ej. co2: [800, 1200] o humidity: [25, 35, 70, 80]",
    ed_rooms: "Habitaciones (YAML)",
    ed_rooms_helper: "Orden y personalización: una lista de {area, name, icon, navigation_path}",
    ed_navigation_path: "Ruta de navegación",
    ed_all_off_button: "Botón «Apagar todo»",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
    rooms_all: "Mostrar todas las habitaciones",
    rooms_check: "Solo las habitaciones que requieren atención",
    ed_sort: "Orden",
    ed_sort_name: "Por nombre",
    ed_exclude_areas: "Habitaciones a excluir",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  const l = (config?.language || hass?.locale?.language || hass?.language || "en").slice(0, 2);
  return i18n[l] ? l : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcEscRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const rcWatts = (w) => (w >= 1000 ? `${(w / 1000).toFixed(w >= 10000 ? 0 : 1)} kW` : `${Math.round(w)} W`);

// Strips a prefix, a suffix and the area name from an entity name, then capitalises it.
const rcCleanName = (name, areaName, prefix, suffix) => {
  let n = (name || "").replace(prefix, "").replace(suffix, "").trim();
  if (areaName && n.toLowerCase() !== areaName.toLowerCase()) {
    n = n.replace(new RegExp(`(^${rcEscRe(areaName)}\\s+|\\s+${rcEscRe(areaName)}$)`, "i"), "");
  }
  return n.charAt(0).toUpperCase() + n.slice(1);
};

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

const rcUnavailable = (st) => ["unavailable", "unknown"].includes(st.state);

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._sig = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    return n && this._config ? 1 + Math.ceil(n / this._cols()) : 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  _areaOf(id) {
    const e = this._hass.entities?.[id];
    if (!e) return undefined;
    return e.area_id ?? this._hass.devices?.[e.device_id]?.area_id;
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // The configured `entities`; otherwise the entities of the area accepted by `_candidate`, minus `exclude`,
  // plus `include` (entities from another room or without one).
  _entries() {
    const h = this._hass;
    const c = this._config;
    const list = (l) => (l || []).map((e) => (typeof e === "string" ? { entity: e } : e)).filter((e) => h.states[e.entity]);
    if (c.entities?.length) return list(c.entities);
    this._prepare();
    const found = c.area ? this._areaIds().filter((id) => h.states[id] && this._candidate(id)).map((entity) => ({ entity })) : [];
    const ids = new Set(found.map((e) => e.entity));
    return [...found, ...list(c.include).filter((e) => !ids.has(e.entity))];
  }

  // Visible entities of the area, minus `exclude`: the registries are scanned again only when they or the config
  // change (an entity outside the entity registry has no area anyway).
  _areaIds() {
    const h = this._hass;
    const c = this._config;
    return rcMemo((this._memo ||= {}), "area", [c, h.entities, h.devices], () => {
      const exclude = new Set(c.exclude || []);
      return Object.keys(h.entities || {}).filter((id) => !exclude.has(id) && !h.entities[id].hidden && this._areaOf(id) === c.area);
    });
  }

  // Hook run before the discovery, for what `_candidate` needs (the camera devices, say).
  _prepare() {}

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  _hide(hidden) {
    this.style.display = hidden ? "none" : "";
    return hidden;
  }

  // Status of a set of opening and leak sensors: a leak, then the open ones, then "All closed" when there are door
  // or window sensors (`closable`), `idle` otherwise.
  _openingStatus(leaks, open, closable, idle = "all_quiet") {
    if (leaks) return this._t("leak");
    if (open) return this._t(open > 1 ? "open_many" : "open_one", { n: open });
    return this._t(closable ? "all_closed" : idle);
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // Overviews: the grid of room tiles (`tile(room)`), its columns, the empty and idle states, then the open room's
  // details kept in step with the rooms shown.
  _roomGrid(grid, rooms, tile) {
    const cols = Number(this._config.columns);
    grid.classList.toggle("fixed", cols >= 1);
    grid.style.setProperty("--cols", String(Math.min(6, Math.max(1, cols || 3))));
    // Every room idle with the "hide idle rooms" option: the header alone says it all.
    const idle = !rooms.length && this._total > 0;
    grid.hidden = idle;
    if (idle) grid.innerHTML = "";
    else grid.innerHTML = rooms.length ? rooms.map(tile).join("") : `<div class="empty">${rcEsc(this._t("no_rooms"))}</div>`;
    if (this._openArea && !rooms.some((x) => x.id === this._openArea)) this._toggle(null);
    else if (this._openArea) this._fillPanel();
  }

  _head({ icon, title, status, chips = "", allOff = false }) {
    const c = this._config;
    return `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
        <div class="title">${rcEsc(title)}</div>
        ${chips}
        <button class="pill${allOff ? " action" : ""}" ${allOff ? `title="${rcEsc(this._t("turn_all_off"))}"` : "disabled"}>
          ${allOff ? '<ha-icon icon="mdi:power"></ha-icon>' : ""}${rcEsc(status)}
        </button>
      </div>`;
  }

  _tile(i, { cls = "", style = "", extra = "", state = i.state }) {
    return `
      <button class="tile ${i.unavailable ? "na" : i.on ? "on" : "off"}${cls}" data-id="${rcEsc(i.id)}"
              ${style ? `style="${rcEsc(style)}"` : ""} title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
        ${extra}
        <span class="ic"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon></span>
        <span class="txt">
          <span class="name">${rcEsc(i.name)}</span>
          <span class="state">${state}</span>
        </span>
      </button>`;
  }

  _paint(level, head, tiles, extraClass = "") {
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
      if (!ids.length) return;
      // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
      if (this._confirmOff) this._confirmOff(ids);
      else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
    });
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x) }).
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      }
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// Lights and plugs: entities that are on or off, a status counting the ones on, an optional "turn everything off".
// Subclasses set `static headIcons` ([on, off]) and `static emptyKey`, and implement `_sigOf(item)` (what a tile
// shows) and `_tileOf(item)`; `_statusExtra(lit)` adds to the status.
class RcToggleCard extends RcCard {
  _statusExtra() {
    return "";
  }

  _draw(items) {
    const c = this._config;
    const lit = items.filter((i) => i.on);
    const level = lit.length ? "on" : "off";

    if (!this._changed(items.map((i) => this._sigOf(i)))) return;
    if (this._hide(c.hide_when_off && level === "off")) return;

    const shown = c.only_on ? items.filter((i) => i.on || i.unavailable) : items;
    this._shown = shown.length;
    const [onIcon, offIcon] = this.constructor.headIcons;
    const status = lit.length
      ? this._t(lit.length > 1 ? "on_many" : "on_one", { n: lit.length })
      : this._t(items.length ? "all_off" : this.constructor.emptyKey);
    const head = this._head({
      icon: lit.length ? onIcon : offIcon,
      title: c.title || this._areaName() || this._t("title"),
      status: status + this._statusExtra(lit),
      allOff: c.all_off_button && lit.length > 0,
    });
    this._paint(level, head, shown.map((i) => this._tileOf(i)).join(""));
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      document.addEventListener("click", this._onUnzoom, true);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      document.removeEventListener("click", this._onUnzoom, true);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 4, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "" }) {
      const c = this._config;
      const nav = c.navigation_path;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                <span class="st">${rcEsc(status)}</span>
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

// ── Overviews: the open room ─────────────────────────────────────────────────
// What both overviews share around their room tiles: a tap follows the room's `navigation_path` or unfolds its
// details in the `.panel` (filled by the subclass's `_fillPanel`, from `_roomGrid`), a click anywhere else folds it
// back and returns to the rooms needing a look. The subclass implements `_shownRooms()` (the tiles shown) and
// `_clearPanel()` (drops its detail cards); `_beforeFold()` (optional) runs first on an outside click.
const rcRoomsPanel = (Base) =>
  class extends Base {
    constructor() {
      super();
      this._onOutside = (ev) => {
        if (!rcOutside(this, ev)) return;
        this._beforeFold?.();
        if (this._openArea) this._toggle(null);
        rcUnzoom(this);
      };
    }

    // A new config rebuilds the room details, which take part of it (language, exclude, thresholds…).
    setConfig(config) {
      this._panelArea = null;
      super.setConfig(config);
    }

    connectedCallback() {
      super.connectedCallback?.();
      document.addEventListener("click", this._onOutside, true);
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      document.removeEventListener("click", this._onOutside, true);
    }

    _tap(aid) {
      const x = this._shownRooms().find((r) => r.id === aid);
      if (x?.navigation_path) rcNavigate(x.navigation_path);
      else this._toggle(this._openArea === aid ? null : aid);
    }

    // Opens a room's details (the render fills the panel), or folds them back.
    _toggle(aid) {
      this._openArea = aid;
      this._panelArea = null;
      this._sig = null;
      this._render();
      if (aid) return;
      const panel = this.shadowRoot.querySelector(".panel");
      panel.hidden = true;
      panel.innerHTML = "";
      this._clearPanel();
    }
  };

// ── Editor ───────────────────────────────────────────────────────────────────
// Fields shared by the room cards' editors.
const rcAreaFields = (navigation) => [
  { name: "area", selector: { area: {} } },
  { name: "title", selector: { text: {} } },
  ...(navigation ? [{ name: "navigation_path", selector: { navigation: {} } }] : []),
  { name: "columns", selector: { number: { min: 1, max: 4, mode: "box" } } },
];
const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

// "Advanced" section, folded, with the options that are lists or maps (edited as YAML) and the language. Its fields
// sit at the root of the config (`flatten`).
const RC_ADVANCED_HELPERS = ["language", "entities", "thresholds", "rooms"];
const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// Entity picker limited to `ids`, left out when there is none.
const rcEntitiesField = (name, ids) =>
  ids.length ? [{ name, selector: { entity: { multiple: true, include_entities: ids } } }] : [];

// Include list: the entities of the card's domains (narrowed by `card.includeMatch` when set), anywhere in the home,
// that the card does not show yet (entities already included stay in the list).
const rcIncludeField = (card, hass, config) => {
  if (!hass) return [];
  const shown = new Set(
    rcProbe(card, hass, { ...config, entities: undefined, include: [] })
      ._entries()
      .map((e) => e.entity),
  );
  const ids = Object.keys(hass.states).filter(
    (id) =>
      card.includeDomains.includes(id.split(".")[0]) &&
      (!card.includeMatch || card.includeMatch(hass, id)) &&
      !shown.has(id) &&
      !hass.entities?.[id]?.hidden &&
      !hass.entities?.[id]?.entity_category,
  );
  for (const e of config?.include || []) {
    const id = typeof e === "string" ? e : e.entity;
    if (!ids.includes(id)) ids.push(id);
  }
  return rcEntitiesField("include", ids);
};

// A detached card of class `card`, with `config` over its defaults, to run its discovery from the editor.
const rcProbe = (card, hass, config) => {
  const probe = document.createElement(card.tag);
  probe._hass = hass;
  probe._config = { ...card.defaults, ...config };
  return probe;
};

// Exclude list limited to what the card finds in the chosen room, with the card's own rules
// (entities already excluded stay in the list).
const rcExcludeField = (card, hass, config) => {
  const ids =
    hass && config?.area
      ? rcProbe(card, hass, { ...config, entities: undefined, exclude: [] })
          ._entries()
          .map((e) => e.entity)
      : [];
  return rcEntitiesField("exclude", ids);
};

// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
const rcEditor = ({ card, helpers, schema }) => {
  const i18n = card.i18n;
  const defaults = Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v)));
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config], () => ({ ...defaults, ...this._config }));
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-room-card",
  });
};

if (!customElements.get("room-overview-card")) {
  console.info(`%c HA-ROOM-CARD %c v${RC_VERSION} `, "background:#43a047;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
  }
  ha-card { padding: 12px; overflow: hidden; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  .title { flex: 1; min-width: 0; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pill { all: unset; flex: none; display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

// The overviews' room grid: the tiles, their icon, chips row, empty state and details panel. Each overview sets the
// tile's default tint and its own levels (`.room { --t: … }`, `.room.lvl-…`), the chips' spacing and the panel extras.
const RC_ROOM_GRID_STYLES = `
  .grid { display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  @container (max-width: 340px) { .grid:not(.fixed) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  .grid[hidden] { display: none; }
  .room { all: unset; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: grid; grid-template-columns: 26px minmax(0, 1fr); grid-template-areas: "ic name" "ic state" "chips chips";
          column-gap: 7px; align-items: center; align-content: start; padding: 6px 7px; border-radius: 10px;
          background: var(--secondary-background-color, transparent); border: 1px solid transparent;
          transition: background .2s, border-color .2s; }
  .room.lvl-warn, .room.lvl-alert {
    background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
    border-color: color-mix(in srgb, var(--t) 22%, transparent); }
  .room:hover { background: color-mix(in srgb, var(--t) 13%, var(--secondary-background-color, transparent)); }
  .room:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .room.sel { border-color: color-mix(in srgb, var(--primary-color) 55%, transparent); }
  .room .ic { grid-area: ic; align-self: start; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
              color: var(--t); background: color-mix(in srgb, var(--t) 16%, transparent); }
  .room.lvl-ok .ic { color: var(--primary-text-color); background: color-mix(in srgb, var(--rc-idle) 14%, transparent); }
  .room .ic ha-icon { --mdc-icon-size: 15px; }
  .room .name { grid-area: name; }
  .room .state { grid-area: state; }
  .room:not(.lvl-ok) .state { color: var(--t); }
  .chips { grid-area: chips; display: flex; flex-wrap: wrap; }
  .chips:empty { display: none; }
  .empty { grid-column: 1 / -1; padding: 12px; text-align: center; font-size: 13px; color: var(--secondary-text-color); }
  .panel { margin-top: 8px; border-radius: 12px; overflow: hidden; background: var(--secondary-background-color, transparent);
           --ha-card-background: transparent; --card-background-color: transparent;
           --ha-card-box-shadow: none; --ha-card-border-width: 0; }
  .panel[hidden] { display: none; }
  @media (prefers-reduced-motion: reduce) { .room { animation: none; transition: none; } }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  .mini .badge { width: 32px; height: 32px; }
  .mini .badge ha-icon { --mdc-icon-size: 20px; }
  .body { flex: 1; min-width: 0; min-height: 32px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { flex: 0 1 auto; line-height: 1.25; }
  .st { flex: none; margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 18px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; color: var(--t); align-self: center; margin-right: 2px; }
  .r.pill { color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;

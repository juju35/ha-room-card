/**
 * Shared by the room cards (its names are used by the other src/ files): discovery rules, i18n helpers, the base card (header, tiles,
 * tap / hold / drag), the visual editor and the common styles.
 * https://github.com/juju35/ha-room-card
 */
const RC_VERSION = "__VERSION__";

// ── Discovery rules ──────────────────────────────────────────────────────────
// Smoke, carbon monoxide, gas and water leak detectors are left to ha-safety-card (safety-card, safety-overview-card).
const RC_OPENING_CLASSES = ["door", "window", "opening", "garage_door"];
const RC_PRESENCE_CLASSES = ["occupancy", "presence", "motion"];
// A switch driving a light belongs to the lights card, a switch that is a plug to the plugs card.
const RC_LIGHT_NAME = /(^|\s)(lumi[eè]re|lampe|lamp|light|veilleuse|guirlande)(\s|$)/i;
const RC_PLUG_NAME = /(^|\s)(prise|multiprise|plug|outlet|socket)(\s|$)/i;
const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

const rcIsLightSwitch = (st) => RC_LIGHT_NAME.test(st.attributes.friendly_name || "");
const rcIsPlug = (st) =>
  !rcIsLightSwitch(st) && (st.attributes.device_class === "outlet" || RC_PLUG_NAME.test(st.attributes.friendly_name || ""));

// What each room card shows, shared with the Overview so that both count the same entities.
// Detections that are not about people, which cameras report as motion: pets never count, vehicles only outdoors.
const RC_PET = /(^|[\s_.-])(pets?|animals?|animaux|chiens?|chats?|dogs?|cats?)($|[\s_-])/i;
const RC_VEHICLE = /(^|[\s_.-])(vehicles?|v[ée]hicules?|voitures?|cars?)($|[\s_-])/i;
// An outdoor room, from its name: garden, terrace, balcony, patio, yard, driveway, porch, gate, parking…
const RC_OUTDOOR =
  /jardin|terrasse|balcon|patio|ext[ée]rieur|cour(\s|$)|all[ée]e|porche|portail|parking|garden|terrace|balcony|outdoor|outside|yard|driveway|porch|gate/i;
const rcIsOutdoor = (area) => !!area && RC_OUTDOOR.test(`${area.name || ""} ${area.area_id || ""}`);

// Sensors card: door, window and opening sensors, plus presence and motion unless `presence` is false. Camera
// detections count, except pets, and vehicles outside an `outdoor` room.
const rcMatchSensor = (hass, id, { presence = true, outdoor = false } = {}) => {
  if (!id.startsWith("binary_sensor.")) return false;
  const st = hass.states[id];
  const dc = st?.attributes.device_class;
  if (RC_OPENING_CLASSES.includes(dc)) return true;
  if (presence === false || !RC_PRESENCE_CLASSES.includes(dc)) return false;
  const name = `${id} ${st.attributes.friendly_name || ""}`;
  if (RC_PET.test(name)) return false;
  return outdoor || !RC_VEHICLE.test(name);
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

// The overviews' `rooms[].include`: entities added by hand to a room, from another room, without one or not
// recognised (a template without an area or a device class, say). A map of entity ID to { aid, entry }, `entry` the
// `{entity, name, icon}` item; an entity listed in several rooms counts in the first. Only existing states count.
const rcRoomIncludes = (hass, config) => {
  const out = new Map();
  for (const r of config.rooms || []) {
    for (const e of r?.include || []) {
      const entry = typeof e === "string" ? { entity: e } : e;
      if (entry?.entity && hass.states[entry.entity] && !out.has(entry.entity)) out.set(entry.entity, { aid: r.area, entry });
    }
  }
  return out;
};
// The entities included in a room other than `aid`: left out of `aid`'s details card, as of its tiles.
const rcIncludedElsewhere = (included, aid) => [...included].filter(([, x]) => x.aid !== aid).map(([id]) => id);
// The `include` items of one room, for its details card.
const rcIncludesOf = (included, aid, keep = () => true) =>
  [...included.values()].filter((x) => x.aid === aid && keep(x.entry.entity)).map((x) => x.entry);

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

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
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
    ed_illustration: "Illustrated header",
    ed_illustration_helper: "An animated picture of the room in the header, following its state",
    ed_illustration_theme: "Illustration theme",
    ed_illustration_theme_helper: "Automatic: night with a dark theme, day with a light theme",
    theme_auto: "Automatic",
    theme_day: "Day",
    theme_night: "Night",
    ed_room_type: "Room type",
    ed_room_type_helper: "Wall colour, furniture and floor of the picture; automatic: from the area's name or icon",
    room_auto: "Automatic",
    room_none: "None (card theme only)",
    room_living: "Living room",
    room_bedroom: "Bedroom",
    room_kids: "Kids' room",
    room_kitchen: "Kitchen",
    room_dining: "Dining room",
    room_bathroom: "Bathroom",
    room_toilets: "Toilets",
    room_hallway: "Hallway",
    room_entry: "Entrance",
    room_office: "Office",
    room_laundry: "Laundry room",
    room_garage: "Garage",
    all_closed: "All closed",
    all_quiet: "All quiet",
    open_one: "{n} open",
    open_many: "{n} open",
    unavail_one: "{n} unavailable",
    unavail_many: "{n} unavailable",
    unavailable: "Unavailable",
    on: "On",
    off: "Off",
    turn_all_off: "Turn everything off",
    ed_area: "Area",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_title_helper: "Leave empty for the area name",
    ed_columns: "Columns",
    ed_layout: "Layout",
    ed_layout_helper: "Tiles: one large tile per entity, like the Tile card, easier to tap on a phone",
    ed_layout_compact: "Compact",
    ed_layout_tiles: "Tiles",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_names: "Entity names",
    ed_names_helper: "Rename what shows on the card; empty keeps the default",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_entities: "Explicit entities (YAML)",
    ed_entities_helper: "Replaces the automatic discovery: entity IDs, or {entity, name, icon}",
    ed_thresholds: "Comfort thresholds (YAML)",
    ed_thresholds_helper: "Per kind, in the sensor's unit, e.g. co2: [800, 1200] or humidity: [25, 35, 70, 80]",
    ed_rooms: "Rooms (YAML)",
    ed_rooms_helper: "Order and overrides: a list of {area, name, icon, navigation_path, include}",
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
    ed_illustration: "En-tête illustré",
    ed_illustration_helper: "Une image animée de la pièce dans l'en-tête, qui suit son état",
    ed_illustration_theme: "Thème de l'illustration",
    ed_illustration_theme_helper: "Automatique : nuit avec un thème sombre, jour avec un thème clair",
    theme_auto: "Automatique",
    theme_day: "Jour",
    theme_night: "Nuit",
    ed_room_type: "Type de pièce",
    ed_room_type_helper: "Couleur des murs, meubles et sol de l'image ; automatique : d'après le nom ou l'icône de la pièce",
    room_auto: "Automatique",
    room_none: "Aucun (thème de la carte seul)",
    room_living: "Salon",
    room_bedroom: "Chambre",
    room_kids: "Chambre d'enfant",
    room_kitchen: "Cuisine",
    room_dining: "Salle à manger",
    room_bathroom: "Salle de bain",
    room_toilets: "Toilettes",
    room_hallway: "Couloir",
    room_entry: "Entrée",
    room_office: "Bureau",
    room_laundry: "Buanderie",
    room_garage: "Garage",
    all_closed: "Tout est fermé",
    all_quiet: "Tout est calme",
    open_one: "{n} ouverture",
    open_many: "{n} ouvertures",
    unavail_one: "{n} indisponible",
    unavail_many: "{n} indisponibles",
    unavailable: "Indisponible",
    on: "Allumée",
    off: "Éteinte",
    turn_all_off: "Tout éteindre",
    ed_area: "Pièce",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_title_helper: "Laisser vide pour le nom de la pièce",
    ed_columns: "Colonnes",
    ed_layout: "Disposition",
    ed_layout_helper: "Tuiles : une grande tuile par entité, comme la carte Tuile, plus facile à toucher sur téléphone",
    ed_layout_compact: "Compacte",
    ed_layout_tiles: "Tuiles",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_names: "Noms des entités",
    ed_names_helper: "Renommer l'affichage sur la carte ; vide garde le nom par défaut",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_entities: "Entités explicites (YAML)",
    ed_entities_helper: "Remplace la découverte automatique : des identifiants d'entités, ou {entity, name, icon}",
    ed_thresholds: "Seuils de confort (YAML)",
    ed_thresholds_helper: "Par type, dans l'unité du capteur, par exemple co2: [800, 1200] ou humidity: [25, 35, 70, 80]",
    ed_rooms: "Pièces (YAML)",
    ed_rooms_helper: "Ordre et personnalisation : une liste de {area, name, icon, navigation_path, include}",
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
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_helper: "Ein animiertes Bild des Raums in der Kopfzeile, das seinem Zustand folgt",
    ed_illustration_theme: "Thema der Illustration",
    ed_illustration_theme_helper: "Automatisch: Nacht bei dunklem Thema, Tag bei hellem Thema",
    theme_auto: "Automatisch",
    theme_day: "Tag",
    theme_night: "Nacht",
    ed_room_type: "Raumtyp",
    ed_room_type_helper: "Wandfarbe, Möbel und Boden des Bildes; automatisch: aus Name oder Symbol des Bereichs",
    room_auto: "Automatisch",
    room_none: "Keiner (nur Kartenthema)",
    room_living: "Wohnzimmer",
    room_bedroom: "Schlafzimmer",
    room_kids: "Kinderzimmer",
    room_kitchen: "Küche",
    room_dining: "Esszimmer",
    room_bathroom: "Badezimmer",
    room_toilets: "Toilette",
    room_hallway: "Flur",
    room_entry: "Eingang",
    room_office: "Büro",
    room_laundry: "Waschküche",
    room_garage: "Garage",
    all_closed: "Alles geschlossen",
    all_quiet: "Alles ruhig",
    open_one: "{n} offen",
    open_many: "{n} offen",
    unavail_one: "{n} nicht verfügbar",
    unavail_many: "{n} nicht verfügbar",
    unavailable: "Nicht verfügbar",
    on: "An",
    off: "Aus",
    turn_all_off: "Alles ausschalten",
    ed_area: "Bereich",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_title_helper: "Leer lassen für den Namen des Bereichs",
    ed_columns: "Spalten",
    ed_layout: "Layout",
    ed_layout_helper: "Kacheln: eine große Kachel pro Entität wie die Kachel-Karte, auf dem Handy leichter anzutippen",
    ed_layout_compact: "Kompakt",
    ed_layout_tiles: "Kacheln",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_names: "Entitätsnamen",
    ed_names_helper: "Anzeigenamen auf der Karte ändern; leer behält den Standard",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_entities: "Explizite Entitäten (YAML)",
    ed_entities_helper: "Ersetzt die automatische Erkennung: Entitäts-IDs oder {entity, name, icon}",
    ed_thresholds: "Komfortschwellen (YAML)",
    ed_thresholds_helper: "Pro Art, in der Einheit des Sensors, z. B. co2: [800, 1200] oder humidity: [25, 35, 70, 80]",
    ed_rooms: "Räume (YAML)",
    ed_rooms_helper: "Reihenfolge und Anpassungen: eine Liste von {area, name, icon, navigation_path, include}",
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
    ed_illustration: "Cabecera ilustrada",
    ed_illustration_helper: "Una imagen animada de la habitación en la cabecera, que sigue su estado",
    ed_illustration_theme: "Tema de la ilustración",
    ed_illustration_theme_helper: "Automático: noche con un tema oscuro, día con un tema claro",
    theme_auto: "Automático",
    theme_day: "Día",
    theme_night: "Noche",
    ed_room_type: "Tipo de habitación",
    ed_room_type_helper: "Color de pared, muebles y suelo de la imagen; automático: según el nombre o el icono del área",
    room_auto: "Automático",
    room_none: "Ninguno (solo el tema de la tarjeta)",
    room_living: "Salón",
    room_bedroom: "Dormitorio",
    room_kids: "Habitación infantil",
    room_kitchen: "Cocina",
    room_dining: "Comedor",
    room_bathroom: "Baño",
    room_toilets: "Aseo",
    room_hallway: "Pasillo",
    room_entry: "Entrada",
    room_office: "Despacho",
    room_laundry: "Lavadero",
    room_garage: "Garaje",
    all_closed: "Todo cerrado",
    all_quiet: "Todo tranquilo",
    open_one: "{n} abierto",
    open_many: "{n} abiertos",
    unavail_one: "{n} no disponible",
    unavail_many: "{n} no disponibles",
    unavailable: "No disponible",
    on: "Encendido",
    off: "Apagado",
    turn_all_off: "Apagar todo",
    ed_area: "Área",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_title_helper: "Déjalo vacío para usar el nombre del área",
    ed_columns: "Columnas",
    ed_layout: "Diseño",
    ed_layout_helper: "Mosaicos: un mosaico grande por entidad, como la tarjeta Mosaico, más fácil de tocar en el móvil",
    ed_layout_compact: "Compacto",
    ed_layout_tiles: "Mosaicos",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_names: "Nombres de las entidades",
    ed_names_helper: "Cambiar el nombre mostrado en la tarjeta; vacío mantiene el predeterminado",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_entities: "Entidades explícitas (YAML)",
    ed_entities_helper: "Sustituye la detección automática: IDs de entidad, o {entity, name, icon}",
    ed_thresholds: "Umbrales de confort (YAML)",
    ed_thresholds_helper: "Por tipo, en la unidad del sensor, p. ej. co2: [800, 1200] o humidity: [25, 35, 70, 80]",
    ed_rooms: "Habitaciones (YAML)",
    ed_rooms_helper: "Orden y personalización: una lista de {area, name, icon, navigation_path, include}",
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
  sr: {
    ed_illustration: "Илустровано заглавље",
    ed_illustration_helper: "Анимирана слика просторије у заглављу, која прати њено стање",
    ed_illustration_theme: "Тема илустрације",
    ed_illustration_theme_helper: "Аутоматски: ноћ уз тамну тему, дан уз светлу тему",
    theme_auto: "Аутоматски",
    theme_day: "Дан",
    theme_night: "Ноћ",
    ed_room_type: "Врста просторије",
    ed_room_type_helper: "Боја зида, намештај и под слике; аутоматски: према имену или икони области",
    room_auto: "Аутоматски",
    room_none: "Ништа (само тема картице)",
    room_living: "Дневна соба",
    room_bedroom: "Спаваћа соба",
    room_kids: "Дечја соба",
    room_kitchen: "Кухиња",
    room_dining: "Трпезарија",
    room_bathroom: "Купатило",
    room_toilets: "Тоалет",
    room_hallway: "Ходник",
    room_entry: "Улаз",
    room_office: "Канцеларија",
    room_laundry: "Вешерница",
    room_garage: "Гаража",
    all_closed: "Све је затворено",
    all_quiet: "Све је мирно",
    open_one: "{n} отворено",
    open_few: "{n} отворена",
    open_many: "{n} отворених",
    unavail_one: "Недоступно: {n}",
    unavail_many: "Недоступно: {n}",
    unavailable: "Недоступно",
    on: "Укључено",
    off: "Искључено",
    turn_all_off: "Искључи све",
    ed_area: "Просторија",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_title_helper: "Остави празно за назив просторије",
    ed_columns: "Колоне",
    ed_layout: "Распоред",
    ed_layout_helper: "Плочице: једна велика плочица по ентитету, као картица Плочица, лакше за додир на телефону",
    ed_layout_compact: "Збијено",
    ed_layout_tiles: "Плочице",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_names: "Називи ентитета",
    ed_names_helper: "Промените приказано име на картици; празно задржава подразумевано",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_entities: "Експлицитни ентитети (YAML)",
    ed_entities_helper: "Замењује аутоматско проналажење: ID-ови ентитета или {entity, name, icon}",
    ed_thresholds: "Прагови комфора (YAML)",
    ed_thresholds_helper: "По врсти, у јединици сензора, нпр. co2: [800, 1200] или humidity: [25, 35, 70, 80]",
    ed_rooms: "Собе/Просторије (YAML)",
    ed_rooms_helper: "Редослед и измене: листа са {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Путања за навигацију",
    ed_all_off_button: "Дугме „Искључи све“",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
    rooms_all: "Прикажи сваку собу",
    rooms_check: "Само собе које захтевају пажњу",
    ed_sort: "Сортирање",
    ed_sort_name: "По имену",
    ed_exclude_areas: "Изостави собе",
  },
  "sr-Latn": {
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_helper: "Animirana slika prostorije u zaglavlju, koja prati njeno stanje",
    ed_illustration_theme: "Tema ilustracije",
    ed_illustration_theme_helper: "Automatski: noć uz tamnu temu, dan uz svetlu temu",
    theme_auto: "Automatski",
    theme_day: "Dan",
    theme_night: "Noć",
    ed_room_type: "Vrsta prostorije",
    ed_room_type_helper: "Boja zida, nameštaj i pod slike; automatski: prema imenu ili ikoni oblasti",
    room_auto: "Automatski",
    room_none: "Ništa (samo tema kartice)",
    room_living: "Dnevna soba",
    room_bedroom: "Spavaća soba",
    room_kids: "Dečja soba",
    room_kitchen: "Kuhinja",
    room_dining: "Trpezarija",
    room_bathroom: "Kupatilo",
    room_toilets: "Toalet",
    room_hallway: "Hodnik",
    room_entry: "Ulaz",
    room_office: "Kancelarija",
    room_laundry: "Vešernica",
    room_garage: "Garaža",
    all_closed: "Sve je zatvoreno",
    all_quiet: "Sve je mirno",
    open_one: "{n} otvoreno",
    open_few: "{n} otvorena",
    open_many: "{n} otvorenih",
    unavail_one: "Nedostupno: {n}",
    unavail_many: "Nedostupno: {n}",
    unavailable: "Nedostupno",
    on: "Uključeno",
    off: "Isključeno",
    turn_all_off: "Isključi sve",
    ed_area: "Prostorija",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_title_helper: "Ostavi prazno za naziv prostorije",
    ed_columns: "Kolone",
    ed_layout: "Raspored",
    ed_layout_helper: "Pločice: jedna velika pločica po entitetu, kao kartica Pločica, lakše za dodir na telefonu",
    ed_layout_compact: "Zbijeno",
    ed_layout_tiles: "Pločice",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_names: "Nazivi entiteta",
    ed_names_helper: "Promenite prikazano ime na kartici; prazno zadržava podrazumevano",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_entities: "Eksplicitni entiteti (YAML)",
    ed_entities_helper: "Zamenjuje automatsko pronalaženje: ID-ovi entiteta ili {entity, name, icon}",
    ed_thresholds: "Pragovi komfora (YAML)",
    ed_thresholds_helper: "Po vrsti, u jedinici senzora, npr. co2: [800, 1200] ili humidity: [25, 35, 70, 80]",
    ed_rooms: "Sobe/Prostorije (YAML)",
    ed_rooms_helper: "Redosled i izmene: lista sa {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Putanja za navigaciju",
    ed_all_off_button: "Dugme „Isključi sve“",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
    rooms_all: "Prikaži svaku sobu",
    rooms_check: "Samo sobe koje zahtevaju pažnju",
    ed_sort: "Sortiranje",
    ed_sort_name: "Po imenu",
    ed_exclude_areas: "Izostavi sobe",
  },
  it: {
    ed_illustration: "Intestazione illustrata",
    ed_illustration_helper: "Un'immagine animata della stanza nell'intestazione, che ne segue lo stato",
    ed_illustration_theme: "Tema dell'illustrazione",
    ed_illustration_theme_helper: "Automatico: notte con un tema scuro, giorno con un tema chiaro",
    theme_auto: "Automatico",
    theme_day: "Giorno",
    theme_night: "Notte",
    ed_room_type: "Tipo di stanza",
    ed_room_type_helper: "Colore delle pareti, mobili e pavimento dell'immagine; automatico: dal nome o dall'icona dell'area",
    room_auto: "Automatico",
    room_none: "Nessuno (solo il tema della scheda)",
    room_living: "Soggiorno",
    room_bedroom: "Camera da letto",
    room_kids: "Cameretta",
    room_kitchen: "Cucina",
    room_dining: "Sala da pranzo",
    room_bathroom: "Bagno",
    room_toilets: "WC",
    room_hallway: "Corridoio",
    room_entry: "Ingresso",
    room_office: "Ufficio",
    room_laundry: "Lavanderia",
    room_garage: "Garage",
    all_closed: "Tutto chiuso",
    all_quiet: "Tutto calmo",
    open_one: "{n} apertura",
    open_many: "{n} aperture",
    unavail_one: "{n} non disponibile",
    unavail_many: "{n} non disponibili",
    unavailable: "Non disponibile",
    on: "Accesa",
    off: "Spenta",
    turn_all_off: "Spegni tutto",
    ed_area: "Area",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_title_helper: "Lascia vuoto per usare il nome dell'area",
    ed_columns: "Colonne",
    ed_layout: "Layout",
    ed_layout_helper: "Riquadri: un riquadro grande per entità, come la scheda Riquadro, più facile da toccare sul telefono",
    ed_layout_compact: "Compatto",
    ed_layout_tiles: "Riquadri",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_names: "Nomi delle entità",
    ed_names_helper: "Rinomina ciò che appare sulla scheda; vuoto mantiene il valore predefinito",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_entities: "Entità esplicite (YAML)",
    ed_entities_helper: "Sostituisce il rilevamento automatico: ID entità o {entity, name, icon}",
    ed_thresholds: "Soglie di comfort (YAML)",
    ed_thresholds_helper: "Per tipo, nell'unità del sensore, ad es. co2: [800, 1200] o humidity: [25, 35, 70, 80]",
    ed_rooms: "Stanze (YAML)",
    ed_rooms_helper: "Ordine e personalizzazioni: un elenco di {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Percorso di navigazione",
    ed_all_off_button: "Pulsante «Spegni tutto»",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
    rooms_all: "Mostra tutte le stanze",
    rooms_check: "Solo le stanze da controllare",
    ed_sort: "Ordinamento",
    ed_sort_name: "Per nome",
    ed_exclude_areas: "Stanze da escludere",
  },
  nl: {
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_helper: "Een geanimeerde afbeelding van de kamer in de koptekst, die de toestand volgt",
    ed_illustration_theme: "Thema van de illustratie",
    ed_illustration_theme_helper: "Automatisch: nacht met een donker thema, dag met een licht thema",
    theme_auto: "Automatisch",
    theme_day: "Dag",
    theme_night: "Nacht",
    ed_room_type: "Kamertype",
    ed_room_type_helper: "Wandkleur, meubels en vloer van de afbeelding; automatisch: uit de naam of het pictogram van de ruimte",
    room_auto: "Automatisch",
    room_none: "Geen (alleen kaartthema)",
    room_living: "Woonkamer",
    room_bedroom: "Slaapkamer",
    room_kids: "Kinderkamer",
    room_kitchen: "Keuken",
    room_dining: "Eetkamer",
    room_bathroom: "Badkamer",
    room_toilets: "Toilet",
    room_hallway: "Gang",
    room_entry: "Hal",
    room_office: "Kantoor",
    room_laundry: "Washok",
    room_garage: "Garage",
    all_closed: "Alles dicht",
    all_quiet: "Alles rustig",
    open_one: "{n} open",
    open_many: "{n} open",
    unavail_one: "{n} niet beschikbaar",
    unavail_many: "{n} niet beschikbaar",
    unavailable: "Niet beschikbaar",
    on: "Aan",
    off: "Uit",
    turn_all_off: "Alles uitschakelen",
    ed_area: "Ruimte",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_title_helper: "Leeg laten voor de naam van de ruimte",
    ed_columns: "Kolommen",
    ed_layout: "Indeling",
    ed_layout_helper: "Tegels: één grote tegel per entiteit, zoals de Tegel-kaart, makkelijker aan te tikken op een telefoon",
    ed_layout_compact: "Compact",
    ed_layout_tiles: "Tegels",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_names: "Namen van entiteiten",
    ed_names_helper: "Wijzig de naam op de kaart; leeg houdt de standaard",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_entities: "Expliciete entiteiten (YAML)",
    ed_entities_helper: "Vervangt de automatische detectie: entiteit-ID's of {entity, name, icon}",
    ed_thresholds: "Comfortdrempels (YAML)",
    ed_thresholds_helper: "Per soort, in de eenheid van de sensor, bijv. co2: [800, 1200] of humidity: [25, 35, 70, 80]",
    ed_rooms: "Ruimtes (YAML)",
    ed_rooms_helper: "Volgorde en aanpassingen: een lijst van {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigatiepad",
    ed_all_off_button: "Knop “Alles uitschakelen”",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
    rooms_all: "Alle ruimtes tonen",
    rooms_check: "Alleen de ruimtes die aandacht nodig hebben",
    ed_sort: "Sortering",
    ed_sort_name: "Op naam",
    ed_exclude_areas: "Uit te sluiten ruimtes",
  },
  pt: {
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_helper: "Uma imagem animada da divisão no cabeçalho, que acompanha o seu estado",
    ed_illustration_theme: "Tema da ilustração",
    ed_illustration_theme_helper: "Automático: noite com um tema escuro, dia com um tema claro",
    theme_auto: "Automático",
    theme_day: "Dia",
    theme_night: "Noite",
    ed_room_type: "Tipo de divisão",
    ed_room_type_helper: "Cor da parede, mobília e chão da imagem; automático: pelo nome ou ícone da área",
    room_auto: "Automático",
    room_none: "Nenhum (só o tema do cartão)",
    room_living: "Sala de estar",
    room_bedroom: "Quarto",
    room_kids: "Quarto de criança",
    room_kitchen: "Cozinha",
    room_dining: "Sala de jantar",
    room_bathroom: "Casa de banho",
    room_toilets: "WC",
    room_hallway: "Corredor",
    room_entry: "Entrada",
    room_office: "Escritório",
    room_laundry: "Lavandaria",
    room_garage: "Garagem",
    all_closed: "Tudo fechado",
    all_quiet: "Tudo calmo",
    open_one: "{n} abertura",
    open_many: "{n} aberturas",
    unavail_one: "{n} indisponível",
    unavail_many: "{n} indisponíveis",
    unavailable: "Indisponível",
    on: "Ligada",
    off: "Desligada",
    turn_all_off: "Desligar tudo",
    ed_area: "Área",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_title_helper: "Deixe vazio para usar o nome da área",
    ed_columns: "Colunas",
    ed_layout: "Disposição",
    ed_layout_helper: "Mosaicos: um mosaico grande por entidade, como o cartão Mosaico, mais fácil de tocar no telemóvel",
    ed_layout_compact: "Compacta",
    ed_layout_tiles: "Mosaicos",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_names: "Nomes das entidades",
    ed_names_helper: "Mudar o nome mostrado no cartão; vazio mantém o padrão",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_entities: "Entidades explícitas (YAML)",
    ed_entities_helper: "Substitui a deteção automática: IDs de entidade, ou {entity, name, icon}",
    ed_thresholds: "Limiares de conforto (YAML)",
    ed_thresholds_helper: "Por tipo, na unidade do sensor, p. ex. co2: [800, 1200] ou humidity: [25, 35, 70, 80]",
    ed_rooms: "Divisões (YAML)",
    ed_rooms_helper: "Ordem e personalização: uma lista de {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Caminho de navegação",
    ed_all_off_button: "Botão «Desligar tudo»",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
    rooms_all: "Mostrar todas as divisões",
    rooms_check: "Só as divisões que precisam de atenção",
    ed_sort: "Ordenação",
    ed_sort_name: "Por nome",
    ed_exclude_areas: "Divisões a excluir",
  },
  pl: {
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_helper: "Animowany obraz pomieszczenia w nagłówku, zgodny z jego stanem",
    ed_illustration_theme: "Motyw ilustracji",
    ed_illustration_theme_helper: "Automatycznie: noc przy ciemnym motywie, dzień przy jasnym motywie",
    theme_auto: "Automatycznie",
    theme_day: "Dzień",
    theme_night: "Noc",
    ed_room_type: "Typ pomieszczenia",
    ed_room_type_helper: "Kolor ścian, meble i podłoga obrazu; automatycznie: z nazwy lub ikony obszaru",
    room_auto: "Automatycznie",
    room_none: "Brak (tylko motyw karty)",
    room_living: "Salon",
    room_bedroom: "Sypialnia",
    room_kids: "Pokój dziecięcy",
    room_kitchen: "Kuchnia",
    room_dining: "Jadalnia",
    room_bathroom: "Łazienka",
    room_toilets: "Toaleta",
    room_hallway: "Korytarz",
    room_entry: "Wejście",
    room_office: "Biuro",
    room_laundry: "Pralnia",
    room_garage: "Garaż",
    all_closed: "Zamknięte",
    all_quiet: "Spokojnie",
    open_one: "Otwarte: {n}",
    open_many: "Otwarte: {n}",
    unavail_one: "Niedostępne: {n}",
    unavail_many: "Niedostępne: {n}",
    unavailable: "Niedostępne",
    on: "Włączone",
    off: "Wyłączone",
    turn_all_off: "Wyłącz wszystko",
    ed_area: "Obszar",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_title_helper: "Pozostaw puste, aby użyć nazwy obszaru",
    ed_columns: "Kolumny",
    ed_layout: "Układ",
    ed_layout_helper: "Kafelki: jeden duży kafelek na encję, jak karta Kafelek, łatwiejszy do dotknięcia na telefonie",
    ed_layout_compact: "Kompaktowy",
    ed_layout_tiles: "Kafelki",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_names: "Nazwy encji",
    ed_names_helper: "Zmień nazwę wyświetlaną na karcie; puste zachowuje domyślną",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_entities: "Jawnie podane encje (YAML)",
    ed_entities_helper: "Zastępuje automatyczne wykrywanie: identyfikatory encji lub {entity, name, icon}",
    ed_thresholds: "Progi komfortu (YAML)",
    ed_thresholds_helper: "Dla każdego rodzaju, w jednostce czujnika, np. co2: [800, 1200] lub humidity: [25, 35, 70, 80]",
    ed_rooms: "Pomieszczenia (YAML)",
    ed_rooms_helper: "Kolejność i nadpisania: lista {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Ścieżka nawigacji",
    ed_all_off_button: "Przycisk „Wyłącz wszystko”",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
    rooms_all: "Pokaż wszystkie pomieszczenia",
    rooms_check: "Tylko pomieszczenia wymagające uwagi",
    ed_sort: "Sortowanie",
    ed_sort_name: "Według nazwy",
    ed_exclude_areas: "Pomieszczenia do wykluczenia",
  },
  ro: {
    ed_illustration: "Antet ilustrat",
    ed_illustration_helper: "O imagine animată a camerei în antet, care îi urmează starea",
    ed_illustration_theme: "Tema ilustrației",
    ed_illustration_theme_helper: "Automat: noapte cu o temă întunecată, zi cu o temă luminoasă",
    theme_auto: "Automat",
    theme_day: "Zi",
    theme_night: "Noapte",
    ed_room_type: "Tipul camerei",
    ed_room_type_helper: "Culoarea pereților, mobilierul și podeaua imaginii; automat: după numele sau pictograma zonei",
    room_auto: "Automat",
    room_none: "Niciunul (doar tema cardului)",
    room_living: "Sufragerie",
    room_bedroom: "Dormitor",
    room_kids: "Camera copiilor",
    room_kitchen: "Bucătărie",
    room_dining: "Sufragerie de masă",
    room_bathroom: "Baie",
    room_toilets: "Toaletă",
    room_hallway: "Hol",
    room_entry: "Intrare",
    room_office: "Birou",
    room_laundry: "Spălătorie",
    room_garage: "Garaj",
    all_closed: "Totul închis",
    all_quiet: "Totul liniștit",
    open_one: "Deschise: {n}",
    open_many: "Deschise: {n}",
    unavail_one: "Indisponibile: {n}",
    unavail_many: "Indisponibile: {n}",
    unavailable: "Indisponibil",
    on: "Pornită",
    off: "Oprită",
    turn_all_off: "Oprește tot",
    ed_area: "Zonă",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_title_helper: "Lasă gol pentru numele zonei",
    ed_columns: "Coloane",
    ed_layout: "Aspect",
    ed_layout_helper: "Plăci: o placă mare pentru fiecare entitate, ca fișa Placă, mai ușor de atins pe telefon",
    ed_layout_compact: "Compact",
    ed_layout_tiles: "Plăci",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_names: "Numele entităților",
    ed_names_helper: "Redenumește ce apare pe card; gol păstrează numele implicit",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_entities: "Entități explicite (YAML)",
    ed_entities_helper: "Înlocuiește detectarea automată: ID-uri de entitate sau {entity, name, icon}",
    ed_thresholds: "Praguri de confort (YAML)",
    ed_thresholds_helper: "Pe tip, în unitatea senzorului, de ex. co2: [800, 1200] sau humidity: [25, 35, 70, 80]",
    ed_rooms: "Camere (YAML)",
    ed_rooms_helper: "Ordine și personalizări: o listă de {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Cale de navigare",
    ed_all_off_button: "Butonul „Oprește tot”",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
    rooms_all: "Afișează toate camerele",
    rooms_check: "Doar camerele care necesită atenție",
    ed_sort: "Sortare",
    ed_sort_name: "După nume",
    ed_exclude_areas: "Camere excluse",
  },
  da: {
    ed_illustration: "Illustreret overskrift",
    ed_illustration_helper: "Et animeret billede af rummet i overskriften, der følger dets tilstand",
    ed_illustration_theme: "Illustrationens tema",
    ed_illustration_theme_helper: "Automatisk: nat med et mørkt tema, dag med et lyst tema",
    theme_auto: "Automatisk",
    theme_day: "Dag",
    theme_night: "Nat",
    ed_room_type: "Rumtype",
    ed_room_type_helper: "Vægfarve, møbler og gulv i billedet; automatisk: ud fra områdets navn eller ikon",
    room_auto: "Automatisk",
    room_none: "Ingen (kun kortets tema)",
    room_living: "Stue",
    room_bedroom: "Soveværelse",
    room_kids: "Børneværelse",
    room_kitchen: "Køkken",
    room_dining: "Spisestue",
    room_bathroom: "Badeværelse",
    room_toilets: "Toilet",
    room_hallway: "Gang",
    room_entry: "Entré",
    room_office: "Kontor",
    room_laundry: "Bryggers",
    room_garage: "Garage",
    all_closed: "Alt lukket",
    all_quiet: "Alt roligt",
    open_one: "{n} åben",
    open_many: "{n} åbne",
    unavail_one: "{n} utilgængelig",
    unavail_many: "{n} utilgængelige",
    unavailable: "Utilgængelig",
    on: "Tændt",
    off: "Slukket",
    turn_all_off: "Sluk alt",
    ed_area: "Område",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_title_helper: "Lad stå tomt for at bruge områdets navn",
    ed_columns: "Kolonner",
    ed_layout: "Layout",
    ed_layout_helper: "Fliser: én stor flise pr. entitet som Flise-kortet, nemmere at trykke på en telefon",
    ed_layout_compact: "Kompakt",
    ed_layout_tiles: "Fliser",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_names: "Entitetsnavne",
    ed_names_helper: "Omdøb det, der vises på kortet; tomt beholder standarden",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_entities: "Eksplicitte enheder (YAML)",
    ed_entities_helper: "Erstatter den automatiske registrering: enheds-id'er eller {entity, name, icon}",
    ed_thresholds: "Komforttærskler (YAML)",
    ed_thresholds_helper: "Pr. type, i sensorens enhed, f.eks. co2: [800, 1200] eller humidity: [25, 35, 70, 80]",
    ed_rooms: "Rum (YAML)",
    ed_rooms_helper: "Rækkefølge og tilpasninger: en liste med {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigationssti",
    ed_all_off_button: "Knappen »Sluk alt«",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
    rooms_all: "Vis alle rum",
    rooms_check: "Kun rum, der kræver opmærksomhed",
    ed_sort: "Sortering",
    ed_sort_name: "Efter navn",
    ed_exclude_areas: "Rum, der udelades",
  },
  sv: {
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_helper: "En animerad bild av rummet i rubriken, som följer dess tillstånd",
    ed_illustration_theme: "Illustrationens tema",
    ed_illustration_theme_helper: "Automatiskt: natt med ett mörkt tema, dag med ett ljust tema",
    theme_auto: "Automatiskt",
    theme_day: "Dag",
    theme_night: "Natt",
    ed_room_type: "Rumstyp",
    ed_room_type_helper: "Väggfärg, möbler och golv i bilden; automatiskt: från områdets namn eller ikon",
    room_auto: "Automatiskt",
    room_none: "Ingen (endast kortets tema)",
    room_living: "Vardagsrum",
    room_bedroom: "Sovrum",
    room_kids: "Barnrum",
    room_kitchen: "Kök",
    room_dining: "Matsal",
    room_bathroom: "Badrum",
    room_toilets: "Toalett",
    room_hallway: "Korridor",
    room_entry: "Entré",
    room_office: "Kontor",
    room_laundry: "Tvättstuga",
    room_garage: "Garage",
    all_closed: "Allt stängt",
    all_quiet: "Allt lugnt",
    open_one: "{n} öppen",
    open_many: "{n} öppna",
    unavail_one: "{n} ej tillgänglig",
    unavail_many: "{n} ej tillgängliga",
    unavailable: "Ej tillgänglig",
    on: "På",
    off: "Av",
    turn_all_off: "Stäng av allt",
    ed_area: "Område",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_title_helper: "Lämna tomt för områdets namn",
    ed_columns: "Kolumner",
    ed_layout: "Layout",
    ed_layout_helper: "Rutor: en stor ruta per entitet, som Ruta-kortet, lättare att trycka på i mobilen",
    ed_layout_compact: "Kompakt",
    ed_layout_tiles: "Rutor",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_names: "Entitetsnamn",
    ed_names_helper: "Byt namn som visas på kortet; tomt behåller standardnamnet",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_entities: "Explicita entiteter (YAML)",
    ed_entities_helper: "Ersätter den automatiska identifieringen: entitets-ID:n eller {entity, name, icon}",
    ed_thresholds: "Komfortgränser (YAML)",
    ed_thresholds_helper: "Per typ, i sensorns enhet, t.ex. co2: [800, 1200] eller humidity: [25, 35, 70, 80]",
    ed_rooms: "Rum (YAML)",
    ed_rooms_helper: "Ordning och anpassningar: en lista med {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigeringssökväg",
    ed_all_off_button: "Knappen ”Stäng av allt”",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
    rooms_all: "Visa alla rum",
    rooms_check: "Bara rum som behöver ses över",
    ed_sort: "Sortering",
    ed_sort_name: "Efter namn",
    ed_exclude_areas: "Rum att utesluta",
  },
  bg: {
    ed_illustration: "Илюстрирана заглавка",
    ed_illustration_helper: "Анимирано изображение на стаята в заглавката, което следва състоянието ѝ",
    ed_illustration_theme: "Тема на илюстрацията",
    ed_illustration_theme_helper: "Автоматично: нощ с тъмна тема, ден със светла тема",
    theme_auto: "Автоматично",
    theme_day: "Ден",
    theme_night: "Нощ",
    ed_room_type: "Вид стая",
    ed_room_type_helper: "Цвят на стените, мебели и под на изображението; автоматично: по името или иконата на зоната",
    room_auto: "Автоматично",
    room_none: "Няма (само темата на картата)",
    room_living: "Всекидневна",
    room_bedroom: "Спалня",
    room_kids: "Детска стая",
    room_kitchen: "Кухня",
    room_dining: "Трапезария",
    room_bathroom: "Баня",
    room_toilets: "Тоалетна",
    room_hallway: "Коридор",
    room_entry: "Вход",
    room_office: "Кабинет",
    room_laundry: "Пералня",
    room_garage: "Гараж",
    all_closed: "Всичко е затворено",
    all_quiet: "Всичко е спокойно",
    open_one: "Отворени: {n}",
    open_many: "Отворени: {n}",
    unavail_one: "Недостъпни: {n}",
    unavail_many: "Недостъпни: {n}",
    unavailable: "Недостъпно",
    on: "Включен",
    off: "Изключен",
    turn_all_off: "Изключи всичко",
    ed_area: "Зона",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_title_helper: "Оставете празно за името на зоната",
    ed_columns: "Колони",
    ed_layout: "Оформление",
    ed_layout_helper: "Плочки: по една голяма плочка за обект, като картата Плочка, по-лесна за докосване на телефон",
    ed_layout_compact: "Компактно",
    ed_layout_tiles: "Плочки",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_names: "Имена на обектите",
    ed_names_helper: "Преименувайте показаното на картата; празно запазва името по подразбиране",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_entities: "Изрично зададени обекти (YAML)",
    ed_entities_helper: "Заменя автоматичното откриване: ID на обекти или {entity, name, icon}",
    ed_thresholds: "Прагове на комфорт (YAML)",
    ed_thresholds_helper: "По вид, в мерната единица на сензора, напр. co2: [800, 1200] или humidity: [25, 35, 70, 80]",
    ed_rooms: "Стаи (YAML)",
    ed_rooms_helper: "Ред и персонализиране: списък от {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Път за навигация",
    ed_all_off_button: "Бутон „Изключи всичко“",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
    rooms_all: "Покажи всички стаи",
    rooms_check: "Само стаите, които изискват внимание",
    ed_sort: "Сортиране",
    ed_sort_name: "По име",
    ed_exclude_areas: "Стаи за пропускане",
  },
  ru: {
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_helper: "Анимированное изображение комнаты в заголовке, отражающее её состояние",
    ed_illustration_theme: "Тема иллюстрации",
    ed_illustration_theme_helper: "Автоматически: ночь при тёмной теме, день при светлой теме",
    theme_auto: "Автоматически",
    theme_day: "День",
    theme_night: "Ночь",
    ed_room_type: "Тип комнаты",
    ed_room_type_helper: "Цвет стен, мебель и пол изображения; автоматически: по названию или значку зоны",
    room_auto: "Автоматически",
    room_none: "Нет (только тема карточки)",
    room_living: "Гостиная",
    room_bedroom: "Спальня",
    room_kids: "Детская",
    room_kitchen: "Кухня",
    room_dining: "Столовая",
    room_bathroom: "Ванная",
    room_toilets: "Туалет",
    room_hallway: "Коридор",
    room_entry: "Прихожая",
    room_office: "Кабинет",
    room_laundry: "Прачечная",
    room_garage: "Гараж",
    all_closed: "Всё закрыто",
    all_quiet: "Всё спокойно",
    open_one: "Открыто: {n}",
    open_many: "Открыто: {n}",
    unavail_one: "Недоступно: {n}",
    unavail_many: "Недоступно: {n}",
    unavailable: "Недоступно",
    on: "Включено",
    off: "Выключено",
    turn_all_off: "Выключить всё",
    ed_area: "Пространство",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_title_helper: "Оставьте пустым, чтобы использовать название пространства",
    ed_columns: "Столбцы",
    ed_layout: "Макет",
    ed_layout_helper: "Плитки: одна большая плитка на объект, как карточка «Плитка», удобнее нажимать на телефоне",
    ed_layout_compact: "Компактный",
    ed_layout_tiles: "Плитки",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_names: "Имена объектов",
    ed_names_helper: "Переименовать отображаемое на карточке; пусто — имя по умолчанию",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_entities: "Явно заданные объекты (YAML)",
    ed_entities_helper: "Заменяет автоматическое обнаружение: ID объектов или {entity, name, icon}",
    ed_thresholds: "Пороги комфорта (YAML)",
    ed_thresholds_helper: "Для каждого типа, в единицах датчика, например co2: [800, 1200] или humidity: [25, 35, 70, 80]",
    ed_rooms: "Комнаты (YAML)",
    ed_rooms_helper: "Порядок и настройки: список {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Путь навигации",
    ed_all_off_button: "Кнопка «Выключить всё»",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
    rooms_all: "Показать все комнаты",
    rooms_check: "Только комнаты, требующие внимания",
    ed_sort: "Сортировка",
    ed_sort_name: "По названию",
    ed_exclude_areas: "Исключить комнаты",
  },
  uk: {
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_helper: "Анімоване зображення кімнати в заголовку, що відображає її стан",
    ed_illustration_theme: "Тема ілюстрації",
    ed_illustration_theme_helper: "Автоматично: ніч з темною темою, день зі світлою темою",
    theme_auto: "Автоматично",
    theme_day: "День",
    theme_night: "Ніч",
    ed_room_type: "Тип кімнати",
    ed_room_type_helper: "Колір стін, меблі та підлога зображення; автоматично: за назвою або значком зони",
    room_auto: "Автоматично",
    room_none: "Немає (лише тема картки)",
    room_living: "Вітальня",
    room_bedroom: "Спальня",
    room_kids: "Дитяча",
    room_kitchen: "Кухня",
    room_dining: "Їдальня",
    room_bathroom: "Ванна",
    room_toilets: "Туалет",
    room_hallway: "Коридор",
    room_entry: "Передпокій",
    room_office: "Кабінет",
    room_laundry: "Пральня",
    room_garage: "Гараж",
    all_closed: "Усе зачинено",
    all_quiet: "Усе спокійно",
    open_one: "Відчинено: {n}",
    open_many: "Відчинено: {n}",
    unavail_one: "Недоступно: {n}",
    unavail_many: "Недоступно: {n}",
    unavailable: "Недоступно",
    on: "Увімкнено",
    off: "Вимкнено",
    turn_all_off: "Вимкнути все",
    ed_area: "Простір",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_title_helper: "Залиште порожнім, щоб використати назву простору",
    ed_columns: "Стовпці",
    ed_layout: "Макет",
    ed_layout_helper: "Плитки: одна велика плитка на сутність, як картка «Плитка», зручніше торкатися на телефоні",
    ed_layout_compact: "Компактний",
    ed_layout_tiles: "Плитки",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_names: "Імена сутностей",
    ed_names_helper: "Перейменувати показане на картці; порожнє залишає типове",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_entities: "Явно задані сутності (YAML)",
    ed_entities_helper: "Замінює автоматичне виявлення: ID сутностей або {entity, name, icon}",
    ed_thresholds: "Пороги комфорту (YAML)",
    ed_thresholds_helper: "Для кожного типу, в одиницях датчика, наприклад co2: [800, 1200] або humidity: [25, 35, 70, 80]",
    ed_rooms: "Кімнати (YAML)",
    ed_rooms_helper: "Порядок і налаштування: список {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Шлях навігації",
    ed_all_off_button: "Кнопка «Вимкнути все»",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
    rooms_all: "Показати всі кімнати",
    rooms_check: "Лише кімнати, що потребують уваги",
    ed_sort: "Сортування",
    ed_sort_name: "За назвою",
    ed_exclude_areas: "Виключити кімнати",
  },
  hu: {
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_helper: "A szoba animált képe a fejlécben, amely követi az állapotát",
    ed_illustration_theme: "Az illusztráció témája",
    ed_illustration_theme_helper: "Automatikus: éjszaka sötét témával, nappal világos témával",
    theme_auto: "Automatikus",
    theme_day: "Nappal",
    theme_night: "Éjszaka",
    ed_room_type: "Helyiség típusa",
    ed_room_type_helper: "A kép falszíne, bútorai és padlója; automatikus: a terület neve vagy ikonja alapján",
    room_auto: "Automatikus",
    room_none: "Nincs (csak a kártya témája)",
    room_living: "Nappali",
    room_bedroom: "Hálószoba",
    room_kids: "Gyerekszoba",
    room_kitchen: "Konyha",
    room_dining: "Étkező",
    room_bathroom: "Fürdőszoba",
    room_toilets: "WC",
    room_hallway: "Folyosó",
    room_entry: "Bejárat",
    room_office: "Iroda",
    room_laundry: "Mosókonyha",
    room_garage: "Garázs",
    all_closed: "Minden zárva",
    all_quiet: "Minden nyugodt",
    open_one: "{n} nyitva",
    open_many: "{n} nyitva",
    unavail_one: "{n} nem elérhető",
    unavail_many: "{n} nem elérhető",
    unavailable: "Nem elérhető",
    on: "Be",
    off: "Ki",
    turn_all_off: "Minden kikapcsolása",
    ed_area: "Terület",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_title_helper: "Hagyd üresen a terület nevéhez",
    ed_columns: "Oszlopok",
    ed_layout: "Elrendezés",
    ed_layout_helper: "Csempék: entitásonként egy nagy csempe, mint a Csempe kártya, telefonon könnyebb megérinteni",
    ed_layout_compact: "Tömör",
    ed_layout_tiles: "Csempék",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_names: "Entitások nevei",
    ed_names_helper: "A kártyán megjelenő név átírása; üresen az alapértelmezett marad",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_entities: "Kifejezetten megadott entitások (YAML)",
    ed_entities_helper: "Felülírja az automatikus felismerést: entitásazonosítók vagy {entity, name, icon}",
    ed_thresholds: "Komfortküszöbök (YAML)",
    ed_thresholds_helper: "Típusonként, az érzékelő mértékegységében, pl. co2: [800, 1200] vagy humidity: [25, 35, 70, 80]",
    ed_rooms: "Helyiségek (YAML)",
    ed_rooms_helper: "Sorrend és testreszabás: {area, name, icon, navigation_path, include} elemek listája",
    ed_navigation_path: "Navigációs útvonal",
    ed_all_off_button: "„Minden kikapcsolása” gomb",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
    rooms_all: "Minden helyiség megjelenítése",
    rooms_check: "Csak a figyelmet igénylő helyiségek",
    ed_sort: "Rendezés",
    ed_sort_name: "Név szerint",
    ed_exclude_areas: "Kihagyott helyiségek",
  },
  sk: {
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_helper: "Animovaný obrázok miestnosti v hlavičke, ktorý sleduje jej stav",
    ed_illustration_theme: "Téma ilustrácie",
    ed_illustration_theme_helper: "Automaticky: noc s tmavou témou, deň so svetlou témou",
    theme_auto: "Automaticky",
    theme_day: "Deň",
    theme_night: "Noc",
    ed_room_type: "Typ miestnosti",
    ed_room_type_helper: "Farba stien, nábytok a podlaha obrázka; automaticky: podľa názvu alebo ikony oblasti",
    room_auto: "Automaticky",
    room_none: "Žiadny (len téma karty)",
    room_living: "Obývačka",
    room_bedroom: "Spálňa",
    room_kids: "Detská izba",
    room_kitchen: "Kuchyňa",
    room_dining: "Jedáleň",
    room_bathroom: "Kúpeľňa",
    room_toilets: "WC",
    room_hallway: "Chodba",
    room_entry: "Vstup",
    room_office: "Pracovňa",
    room_laundry: "Práčovňa",
    room_garage: "Garáž",
    all_closed: "Všetko zatvorené",
    all_quiet: "Všetko pokojné",
    open_one: "Otvorené: {n}",
    open_many: "Otvorené: {n}",
    unavail_one: "Nedostupné: {n}",
    unavail_many: "Nedostupné: {n}",
    unavailable: "Nedostupné",
    on: "Zapnuté",
    off: "Vypnuté",
    turn_all_off: "Vypnúť všetko",
    ed_area: "Oblasť",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_title_helper: "Nechajte prázdne pre názov oblasti",
    ed_columns: "Stĺpce",
    ed_layout: "Rozloženie",
    ed_layout_helper: "Dlaždice: jedna veľká dlaždica na entitu ako karta Dlaždica, na telefóne sa ľahšie ťuká",
    ed_layout_compact: "Kompaktné",
    ed_layout_tiles: "Dlaždice",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_names: "Názvy entít",
    ed_names_helper: "Premenujte zobrazené na karte; prázdne ponechá predvolené",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_entities: "Explicitné entity (YAML)",
    ed_entities_helper: "Nahrádza automatické vyhľadávanie: ID entít alebo {entity, name, icon}",
    ed_thresholds: "Prahy komfortu (YAML)",
    ed_thresholds_helper: "Podľa druhu, v jednotke senzora, napr. co2: [800, 1200] alebo humidity: [25, 35, 70, 80]",
    ed_rooms: "Miestnosti (YAML)",
    ed_rooms_helper: "Poradie a úpravy: zoznam {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigačná cesta",
    ed_all_off_button: "Tlačidlo „Vypnúť všetko“",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
    rooms_all: "Zobraziť všetky miestnosti",
    rooms_check: "Len miestnosti vyžadujúce pozornosť",
    ed_sort: "Zoradenie",
    ed_sort_name: "Podľa názvu",
    ed_exclude_areas: "Vynechané miestnosti",
  },
  cs: {
    ed_illustration: "Ilustrované záhlaví",
    ed_illustration_helper: "Animovaný obrázek místnosti v záhlaví, který sleduje její stav",
    ed_illustration_theme: "Téma ilustrace",
    ed_illustration_theme_helper: "Automaticky: noc s tmavým motivem, den se světlým motivem",
    theme_auto: "Automaticky",
    theme_day: "Den",
    theme_night: "Noc",
    ed_room_type: "Typ místnosti",
    ed_room_type_helper: "Barva stěn, nábytek a podlaha obrázku; automaticky: podle názvu nebo ikony oblasti",
    room_auto: "Automaticky",
    room_none: "Žádný (jen téma karty)",
    room_living: "Obývací pokoj",
    room_bedroom: "Ložnice",
    room_kids: "Dětský pokoj",
    room_kitchen: "Kuchyně",
    room_dining: "Jídelna",
    room_bathroom: "Koupelna",
    room_toilets: "WC",
    room_hallway: "Chodba",
    room_entry: "Vstup",
    room_office: "Pracovna",
    room_laundry: "Prádelna",
    room_garage: "Garáž",
    all_closed: "Vše zavřeno",
    all_quiet: "Vše v klidu",
    open_one: "Otevřeno: {n}",
    open_many: "Otevřeno: {n}",
    unavail_one: "Nedostupné: {n}",
    unavail_many: "Nedostupné: {n}",
    unavailable: "Nedostupné",
    on: "Zapnuto",
    off: "Vypnuto",
    turn_all_off: "Vypnout vše",
    ed_area: "Oblast",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_title_helper: "Ponechte prázdné pro název oblasti",
    ed_columns: "Sloupce",
    ed_layout: "Rozložení",
    ed_layout_helper: "Dlaždice: jedna velká dlaždice na entitu jako karta Dlaždice, na telefonu se snáz ťuká",
    ed_layout_compact: "Kompaktní",
    ed_layout_tiles: "Dlaždice",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_names: "Názvy entit",
    ed_names_helper: "Přejmenujte zobrazené na kartě; prázdné ponechá výchozí",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_entities: "Explicitní entity (YAML)",
    ed_entities_helper: "Nahrazuje automatické vyhledávání: ID entit nebo {entity, name, icon}",
    ed_thresholds: "Prahy komfortu (YAML)",
    ed_thresholds_helper: "Podle druhu, v jednotce senzoru, např. co2: [800, 1200] nebo humidity: [25, 35, 70, 80]",
    ed_rooms: "Místnosti (YAML)",
    ed_rooms_helper: "Pořadí a úpravy: seznam {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigační cesta",
    ed_all_off_button: "Tlačítko „Vypnout vše“",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
    rooms_all: "Zobrazit všechny místnosti",
    rooms_check: "Jen místnosti vyžadující pozornost",
    ed_sort: "Řazení",
    ed_sort_name: "Podle názvu",
    ed_exclude_areas: "Vynechané místnosti",
  },
  sl: {
    ed_illustration: "Ilustrirana glava",
    ed_illustration_helper: "Animirana slika prostora v glavi, ki sledi njegovemu stanju",
    ed_illustration_theme: "Tema ilustracije",
    ed_illustration_theme_helper: "Samodejno: noč s temno temo, dan s svetlo temo",
    theme_auto: "Samodejno",
    theme_day: "Dan",
    theme_night: "Noč",
    ed_room_type: "Vrsta prostora",
    ed_room_type_helper: "Barva sten, pohištvo in tla slike; samodejno: po imenu ali ikoni območja",
    room_auto: "Samodejno",
    room_none: "Brez (samo tema kartice)",
    room_living: "Dnevna soba",
    room_bedroom: "Spalnica",
    room_kids: "Otroška soba",
    room_kitchen: "Kuhinja",
    room_dining: "Jedilnica",
    room_bathroom: "Kopalnica",
    room_toilets: "Stranišče",
    room_hallway: "Hodnik",
    room_entry: "Vhod",
    room_office: "Pisarna",
    room_laundry: "Pralnica",
    room_garage: "Garaža",
    all_closed: "Vse zaprto",
    all_quiet: "Vse mirno",
    open_one: "Odprto: {n}",
    open_many: "Odprto: {n}",
    unavail_one: "Ni na voljo: {n}",
    unavail_many: "Ni na voljo: {n}",
    unavailable: "Ni na voljo",
    on: "Vklopljeno",
    off: "Izklopljeno",
    turn_all_off: "Izklopi vse",
    ed_area: "Območje",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_title_helper: "Pustite prazno za ime območja",
    ed_columns: "Stolpci",
    ed_layout: "Postavitev",
    ed_layout_helper: "Ploščice: ena velika ploščica na entiteto, kot kartica Ploščica, lažje za dotik na telefonu",
    ed_layout_compact: "Strnjena",
    ed_layout_tiles: "Ploščice",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_names: "Imena entitet",
    ed_names_helper: "Preimenujte prikazano na kartici; prazno ohrani privzeto",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_entities: "Izrecno navedene entitete (YAML)",
    ed_entities_helper: "Nadomesti samodejno zaznavanje: ID-ji entitet ali {entity, name, icon}",
    ed_thresholds: "Pragovi udobja (YAML)",
    ed_thresholds_helper: "Po vrsti, v enoti senzorja, npr. co2: [800, 1200] ali humidity: [25, 35, 70, 80]",
    ed_rooms: "Prostori (YAML)",
    ed_rooms_helper: "Vrstni red in prilagoditve: seznam {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigacijska pot",
    ed_all_off_button: "Gumb »Izklopi vse«",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
    rooms_all: "Prikaži vse prostore",
    rooms_check: "Samo prostori, ki potrebujejo pozornost",
    ed_sort: "Razvrščanje",
    ed_sort_name: "Po imenu",
    ed_exclude_areas: "Izpuščeni prostori",
  },
  lv: {
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_helper: "Animēts telpas attēls galvenē, kas seko tās stāvoklim",
    ed_illustration_theme: "Ilustrācijas tēma",
    ed_illustration_theme_helper: "Automātiski: nakts ar tumšu tēmu, diena ar gaišu tēmu",
    theme_auto: "Automātiski",
    theme_day: "Diena",
    theme_night: "Nakts",
    ed_room_type: "Telpas veids",
    ed_room_type_helper: "Attēla sienu krāsa, mēbeles un grīda; automātiski: pēc apgabala nosaukuma vai ikonas",
    room_auto: "Automātiski",
    room_none: "Nav (tikai kartītes tēma)",
    room_living: "Dzīvojamā istaba",
    room_bedroom: "Guļamistaba",
    room_kids: "Bērnistaba",
    room_kitchen: "Virtuve",
    room_dining: "Ēdamistaba",
    room_bathroom: "Vannas istaba",
    room_toilets: "Tualete",
    room_hallway: "Gaitenis",
    room_entry: "Ieeja",
    room_office: "Birojs",
    room_laundry: "Veļas telpa",
    room_garage: "Garāža",
    all_closed: "Viss aizvērts",
    all_quiet: "Viss mierīgi",
    open_one: "Atvērti: {n}",
    open_many: "Atvērti: {n}",
    unavail_one: "Nav pieejami: {n}",
    unavail_many: "Nav pieejami: {n}",
    unavailable: "Nav pieejams",
    on: "Ieslēgts",
    off: "Izslēgts",
    turn_all_off: "Izslēgt visu",
    ed_area: "Zona",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_title_helper: "Atstājiet tukšu, lai izmantotu zonas nosaukumu",
    ed_columns: "Kolonnas",
    ed_layout: "Izkārtojums",
    ed_layout_helper: "Flīzes: viena liela flīze katrai entītijai kā kartītē Flīze, tālrunī vieglāk pieskarties",
    ed_layout_compact: "Kompakts",
    ed_layout_tiles: "Flīzes",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_names: "Entītiju nosaukumi",
    ed_names_helper: "Pārdēvējiet kartē redzamo; tukšs saglabā noklusējumu",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_entities: "Tieši norādītas vienības (YAML)",
    ed_entities_helper: "Aizstāj automātisko noteikšanu: vienību ID vai {entity, name, icon}",
    ed_thresholds: "Komforta sliekšņi (YAML)",
    ed_thresholds_helper: "Pēc veida, sensora mērvienībā, piem., co2: [800, 1200] vai humidity: [25, 35, 70, 80]",
    ed_rooms: "Telpas (YAML)",
    ed_rooms_helper: "Secība un pielāgojumi: saraksts ar {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Navigācijas ceļš",
    ed_all_off_button: "Poga “Izslēgt visu”",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
    rooms_all: "Rādīt visas telpas",
    rooms_check: "Tikai telpas, kurām jāpievērš uzmanība",
    ed_sort: "Kārtošana",
    ed_sort_name: "Pēc nosaukuma",
    ed_exclude_areas: "Izslēdzamās telpas",
  },
  el: {
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_helper: "Μια κινούμενη εικόνα του δωματίου στην κεφαλίδα, που ακολουθεί την κατάστασή του",
    ed_illustration_theme: "Θέμα εικονογράφησης",
    ed_illustration_theme_helper: "Αυτόματο: νύχτα με σκούρο θέμα, μέρα με ανοιχτό θέμα",
    theme_auto: "Αυτόματο",
    theme_day: "Ημέρα",
    theme_night: "Νύχτα",
    ed_room_type: "Τύπος δωματίου",
    ed_room_type_helper: "Χρώμα τοίχου, έπιπλα και δάπεδο της εικόνας· αυτόματο: από το όνομα ή το εικονίδιο της περιοχής",
    room_auto: "Αυτόματο",
    room_none: "Κανένας (μόνο το θέμα της κάρτας)",
    room_living: "Σαλόνι",
    room_bedroom: "Υπνοδωμάτιο",
    room_kids: "Παιδικό δωμάτιο",
    room_kitchen: "Κουζίνα",
    room_dining: "Τραπεζαρία",
    room_bathroom: "Μπάνιο",
    room_toilets: "Τουαλέτα",
    room_hallway: "Διάδρομος",
    room_entry: "Είσοδος",
    room_office: "Γραφείο",
    room_laundry: "Πλυσταριό",
    room_garage: "Γκαράζ",
    all_closed: "Όλα κλειστά",
    all_quiet: "Όλα ήσυχα",
    open_one: "{n} ανοιχτό",
    open_many: "{n} ανοιχτά",
    unavail_one: "Μη διαθέσιμα: {n}",
    unavail_many: "Μη διαθέσιμα: {n}",
    unavailable: "Μη διαθέσιμο",
    on: "Ενεργή",
    off: "Ανενεργή",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_area: "Περιοχή",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_title_helper: "Αφήστε το κενό για το όνομα της περιοχής",
    ed_columns: "Στήλες",
    ed_layout: "Διάταξη",
    ed_layout_helper: "Πλακίδια: ένα μεγάλο πλακίδιο ανά οντότητα, όπως η κάρτα Πλακίδιο, πιο εύκολο στο πάτημα στο κινητό",
    ed_layout_compact: "Συμπαγής",
    ed_layout_tiles: "Πλακίδια",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_names: "Ονόματα οντοτήτων",
    ed_names_helper: "Μετονομάστε αυτό που εμφανίζεται στην κάρτα· κενό κρατά το προεπιλεγμένο",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_entities: "Ρητές οντότητες (YAML)",
    ed_entities_helper: "Αντικαθιστά τον αυτόματο εντοπισμό: αναγνωριστικά οντοτήτων ή {entity, name, icon}",
    ed_thresholds: "Όρια άνεσης (YAML)",
    ed_thresholds_helper: "Ανά είδος, στη μονάδα του αισθητήρα, π.χ. co2: [800, 1200] ή humidity: [25, 35, 70, 80]",
    ed_rooms: "Δωμάτια (YAML)",
    ed_rooms_helper: "Σειρά και προσαρμογές: μια λίστα με {area, name, icon, navigation_path, include}",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    ed_all_off_button: "Κουμπί «Απενεργοποίηση όλων»",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
    rooms_all: "Εμφάνιση όλων των δωματίων",
    rooms_check: "Μόνο τα δωμάτια που χρειάζονται έλεγχο",
    ed_sort: "Ταξινόμηση",
    ed_sort_name: "Κατά όνομα",
    ed_exclude_areas: "Δωμάτια προς εξαίρεση",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

// Plural key for `n` items: `<base>_one`, `<base>_few` or `<base>_many` (the "other" form), from the CLDR category of
// `n` in `lang` (Serbian 1 / 2-4 / 5+, 21 / 22…). `_few` is optional: without it, `_many` is used. A `_one` text without
// {n} ("Turn this plug off?") only means exactly one.
const rcPluralKey = (i18n, lang, base, n) => {
  let cat;
  try {
    cat = new Intl.PluralRules(lang).select(n);
  } catch {
    cat = n === 1 ? "one" : "other";
  }
  const text = (k) => i18n[lang]?.[k] ?? RC_I18N[lang]?.[k];
  if (cat === "one" && (n === 1 || text(`${base}_one`)?.includes("{n}"))) return `${base}_one`;
  if (cat === "few" && text(`${base}_few`) != null) return `${base}_few`;
  return `${base}_many`;
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// The whole width of an element's text in its own font, an ellipsised one included.
const textWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

const rcEscRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// A power in the card's language (*1,2 kW* in French), from `lang` (defaults to the browser's).
const rcWatts = (w, lang) => {
  const kw = w >= 1000;
  const digits = kw && w < 10000 ? 1 : 0;
  let text;
  try {
    text = new Intl.NumberFormat(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(kw ? w / 1000 : w);
  } catch {
    text = (kw ? w / 1000 : w).toFixed(digits);
  }
  return `${text} ${kw ? "kW" : "W"}`;
};

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

// Wires a card header to its `navigation_path`: click, and Enter on the header itself. `opts`: the listeners'
// options (the card's abort signal, so that the next redraw can wire the same node again).
const rcBindNav = (head, path, opts) => {
  head.addEventListener("click", () => rcNavigate(path), opts);
  head.addEventListener(
    "keydown",
    (ev) => {
      if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
    },
    opts,
  );
};

// ── In-place redraw ──
// Home Assistant sets `hass` on every state change of the house. Rewriting the card's whole content then (innerHTML)
// replaces every node: <ha-card> and <ha-icon> come back empty until their own update, the scene's animations start
// over, the status pill is measured before the new <ha-card> lays out its content (wrong line, other height), and
// the sections view reflows under the page (it moves by itself). rcMorph brings the nodes in place in line with the
// new markup instead: same node, text and attributes updated; a tile is matched by its key (data-id, data-area,
// data-scene), the rest by position and tag. Attributes the card sets itself after drawing (the pill's fit) are
// kept, and so are the nodes it adds itself (data-rc-own: the mini cards' zoom button).
const RC_KEEP_ATTRS = new Set(["data-wrap", "data-dot"]);
const rcIsOwn = (n) => n?.nodeType === 1 && n.hasAttribute("data-rc-own");
const rcKeyOf = (n) => (n.nodeType === 1 ? (n.getAttribute("data-id") ?? n.getAttribute("data-area") ?? n.getAttribute("data-scene")) : null);

const rcPatchNode = (a, b) => {
  if (a.nodeType !== 1) {
    if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
    return;
  }
  for (const { name, value } of b.attributes) if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  for (const { name } of [...a.attributes]) if (!b.hasAttribute(name) && !RC_KEEP_ATTRS.has(name)) a.removeAttribute(name);
  rcMorphChildren(a, b);
};

const rcMorphChildren = (from, to) => {
  const old = [...from.childNodes].filter((n) => !rcIsOwn(n));
  const keyed = new Map();
  for (const n of old) {
    const k = rcKeyOf(n);
    if (k != null) keyed.set(`${n.nodeName}|${k}`, n);
  }
  const used = new Set();
  let cursor = 0;
  let prev = null;
  for (const n of [...to.childNodes]) {
    const k = rcKeyOf(n);
    let match = null;
    if (k != null) match = keyed.get(`${n.nodeName}|${k}`) ?? null;
    else {
      while (cursor < old.length && (used.has(old[cursor]) || rcKeyOf(old[cursor]) != null)) cursor++;
      if (old[cursor]?.nodeName === n.nodeName) match = old[cursor++];
    }
    if (match && !used.has(match)) {
      used.add(match);
      rcPatchNode(match, n);
    } else match = n;
    // Where it goes: right after the previous node, before the card's own nodes (which stay at the end).
    let ref = prev ? prev.nextSibling : from.firstChild;
    let own = null;
    while (rcIsOwn(ref)) {
      own ??= ref;
      ref = ref.nextSibling;
    }
    if (ref !== match) from.insertBefore(match, ref ?? own);
    prev = match;
  }
  for (const n of old) if (!used.has(n) && n.parentNode === from) from.removeChild(n);
};

// `el`'s content brought in line with `html`, in place (see above); a plain rewrite where there is no DOM to morph.
const rcMorph = (el, html) => {
  if (!el.childNodes || typeof document.createElement("template").content !== "object") {
    el.innerHTML = html;
    return;
  }
  const t = document.createElement("template");
  t.innerHTML = html;
  rcMorphChildren(el, t.content);
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
  constructor() {
    super();
    // Kept in the DOM by hui-card while hidden (see _hide).
    this.connectedWhileHidden = true;
  }

  // Set by hui-card: a card hidden by its `hide_when_*` option still shows in the editor preview and in edit mode.
  set preview(v) {
    this._setMode("_isPreview", v);
  }

  get preview() {
    return !!this._isPreview;
  }

  set editMode(v) {
    this._setMode("_isEditMode", v);
  }

  get editMode() {
    return !!this._isEditMode;
  }

  _setMode(key, v) {
    if (!!this[key] === !!v) return;
    this[key] = !!v;
    this._sig = null;
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

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
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
    // The banner's status pill is fitted after every redraw of the card (each draw calls _fitPill) and for every
    // new width; the observer is let go while the card is off the page.
    if (typeof ResizeObserver === "function") {
      this._fitObserver = new ResizeObserver((entries) => {
        const w = Math.round(entries.at(-1).contentRect.width);
        if (w === this._fitWidth) return;
        this._fitWidth = w;
        this._fitPill();
      });
      if (this.isConnected !== false) this._fitObserver.observe(this);
    }
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._fitObserver?.observe(this);
  }

  // The status pill stays right after the title only while the whole title and the pill's whole label fit on that
  // row; otherwise it takes a line of its own under the title and subtitle (data-wrap), and on the banner, when even
  // then the text would run into the floor strip, it keeps its dot alone (data-dot). Measured in the real fonts (the
  // pill at its natural width), so that every language and title length gets its own answer.
  _fitPill() {
    const root = this.shadowRoot;
    // Home Assistant's <ha-card> (a Lit element) lays out its content only from its first update, a microtask after
    // it is connected: measured before, everything is 0 px wide and the pill lands on the wrong line. Fitted then.
    const card = root?.querySelector?.("ha-card");
    if (card && card.hasUpdated === false && card.updateComplete?.then) {
      card.updateComplete.then(() => this._fitPill());
      return;
    }
    for (const pill of root?.querySelectorAll?.(".banner .trow > .pill, .banner .trow > .st, .head > .pill, .mini .head > .st") || []) {
      const banner = pill.closest(".banner");
      const host = banner || pill.parentElement;
      const title = pill.parentElement.querySelector(":scope > .title");
      if (!pill.getBoundingClientRect || !title) continue;
      host.removeAttribute("data-wrap");
      host.removeAttribute("data-dot");
      // The room the title and the pill share now (the banner's row, or the classic header's title + pill), and the
      // room they need: the whole title and the pill at its natural width.
      const have = banner ? pill.parentElement.getBoundingClientRect().width : title.getBoundingClientRect().width + pill.getBoundingClientRect().width;
      const gap = banner ? parseFloat(getComputedStyle(pill.parentElement).columnGap) || 0 : 0;
      pill.style.maxWidth = "none";
      pill.style.flex = "none";
      const natural = pill.getBoundingClientRect().width;
      pill.style.maxWidth = "";
      pill.style.flex = "";
      const shown = getComputedStyle(title).display !== "none" && getComputedStyle(title).visibility !== "hidden";
      if ((shown ? textWidth(title) + gap : 0) + natural <= have) continue;
      host.setAttribute("data-wrap", "");
      if (!banner) continue;
      const t = pill.closest(".titles");
      const sub = t.querySelector(":scope > .sub, :scope > .hchips");
      if (sub && sub.scrollWidth > sub.clientWidth) sub.title = sub.textContent.replace(/\s+/g, " ").trim();
      const r = t.getBoundingClientRect();
      const box = banner.getBoundingClientRect();
      const floor = banner.querySelector(".ground")?.getBoundingClientRect().top ?? box.bottom;
      if (r.bottom > floor + 0.5 || r.top < box.top - 0.5 || natural > r.width + 0.5) host.setAttribute("data-dot", "");
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._fitObserver?.disconnect();
    this._fitWidth = null;
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.hidden) return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
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

  // `<base>_one` / `_few` / `_many` for `n`, with {n} filled in.
  _tn(base, n, vars) {
    return this._t(rcPluralKey(this.constructor.i18n, this._lang(), base, n), { ...vars, n });
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
    // `names` (a map entity_id → label, set graphically or in YAML) renames an entity on the card; an inline
    // `name` on an entities/include entry is more specific and wins over it.
    const named = (e) => (c.names?.[e.entity] && !e.name ? { ...e, name: c.names[e.entity] } : e);
    const list = (l) => (l || []).map((e) => (typeof e === "string" ? { entity: e } : e)).filter((e) => h.states[e.entity]).map(named);
    if (c.entities?.length) return list(c.entities);
    this._prepare();
    const found = c.area ? this._areaIds().filter((id) => h.states[id] && this._candidate(id)).map((entity) => named({ entity })) : [];
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

  // Hook run before the discovery, for what `_candidate` needs.
  _prepare() {}

  // Re-render only when something visible changed.
  _changed(parts) {
    // The config is serialised once per config object (it is replaced, never changed in place), not on every push.
    if (this._config !== this._sigConfig) {
      this._sigConfig = this._config;
      this._sigConfigJson = JSON.stringify(this._config);
    }
    const sig = `${this._sigConfigJson}|${JSON.stringify([this._lang(), this._illustrated() && this._night(), parts])}`;
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Hides the card and tells Lovelace (card-visibility-changed): hui-card reads the `hidden` property and then
  // drops the card's slot in a sections view. connectedWhileHidden keeps the card in the DOM so that it keeps
  // following its entities and shows again on its own. Never hidden in the editor preview / edit mode.
  _hide(hidden) {
    hidden = !!hidden && !this._isEditMode && !this._isPreview;
    this.connectedWhileHidden = true;
    if (this.hidden !== hidden) {
      this.hidden = hidden;
      this.style.display = hidden ? "none" : "";
      this.dispatchEvent(new CustomEvent("card-visibility-changed", { detail: { value: !hidden }, bubbles: true, composed: true }));
    }
    return hidden;
  }

  // Status of a set of opening sensors: the open ones, then the unavailable ones (`unavail`: a sensor that cannot report
  // is no all-clear), then "All closed" when there are door or window sensors (`closable`), `idle` otherwise.
  _openingStatus(open, closable, idle = "all_quiet", unavail = 0) {
    if (open) return this._tn("open", open);
    if (unavail) return this._tn("unavail", unavail);
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

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  // Overviews: the grid of room tiles (`tile(room)`), its columns, the empty and idle states, then the open room's
  // details kept in step with the rooms shown.
  _roomGrid(grid, rooms, tile) {
    const cols = Number(this._config.columns);
    // A `columns` of 1 or 2 holds on a narrow card; 3 and more go down to two under 340 px, one under 260 px.
    grid.classList.toggle("fixed", cols >= 1 && cols <= 2);
    grid.style.setProperty("--cols", String(Math.min(6, Math.max(1, cols || 3))));
    // Every room idle with the "hide idle rooms" option: the header alone says it all.
    const idle = !rooms.length && this._total > 0;
    grid.hidden = idle;
    // In place: the tiles keep their nodes from one update to the next (see rcMorph).
    rcMorph(grid, idle ? "" : rooms.length ? rooms.map(tile).join("") : `<div class="empty">${rcEsc(this._t("no_rooms"))}</div>`);
    if (this._openArea && !rooms.some((x) => x.id === this._openArea)) this._toggle(null);
    else if (this._openArea) this._fillPanel();
  }

  // ── Illustrated header (src/scene.js) ──
  _illustrated() {
    return this._config?.illustration !== false;
  }

  _night() {
    return rcIsNight(this._hass, this._config);
  }

  // What the scene shows: the card's state, from its entities (each card sets `static sceneTheme` and implements it).
  _sceneState() {
    return {};
  }

  _bannerParts() {
    const n = this._night();
    const area = this._hass?.areas?.[this._config.area];
    const s = rcScene(this.constructor.sceneTheme || "lights", rcRoomType(this._config, area), this._sceneState(), n);
    return { cls: `banner${n ? " night" : ""}`, style: `background:${s.wall}`, art: `${s.svg}<div class="ground g-${s.floor}"></div>` };
  }

  // The banner around `inner` (its .head), for the cards that rewrite their whole content.
  _banner(inner) {
    const b = this._bannerParts();
    return `<div class="${b.cls}" style="${b.style}"><div class="bn-art">${b.art}</div>${inner}</div>`;
  }

  // The banner `el` already in place (the overviews keep their header node): picture and colours brought up to date.
  _updateBanner(el) {
    if (!el?.querySelector) return;
    const b = this._bannerParts();
    el.className = b.cls;
    el.setAttribute?.("style", b.style);
    const art = el.querySelector(".bn-art");
    if (art && this._artHtml !== b.art) {
      // In place: the scene's animations go on, its nodes are not rebuilt.
      rcMorph(art, b.art);
      this._artHtml = b.art;
    }
  }

  // The overviews draw their card once and keep its header node from one render to the next: true when it was
  // (re)built now (first render, or the illustration switched on or off), its listeners then to be bound.
  _shellOnce(styles, rest) {
    const illus = this._illustrated();
    if (this.shadowRoot.querySelector("ha-card") && this._shell !== illus) this.shadowRoot.innerHTML = "";
    if (this.shadowRoot.querySelector("ha-card")) return false;
    this._shell = illus;
    this._artHtml = null;
    const head = illus ? '<div class="banner"><div class="bn-art"></div><div class="head"></div></div>' : '<div class="head"></div>';
    this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${illus ? RC_BANNER_STYLES : ""}${styles}</style>
        <ha-card>${head}${rest}</ha-card>`;
    return true;
  }

  _head({ icon, title, status, chips = "", allOff = false }) {
    const c = this._config;
    if (this._illustrated()) {
      return this._banner(`
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
        <div class="titles">
          <div class="trow"><div class="title">${rcEsc(title)}</div><button class="pill${allOff ? " action" : ""}" title="${rcEsc(allOff ? this._t("turn_all_off") : status)}"${allOff ? "" : " disabled"}>${allOff ? '<ha-icon icon="mdi:power"></ha-icon>' : ""}<span class="pt">${rcEsc(status)}</span></button></div>
          ${chips.trim() ? `<div class="sub">${chips}</div>` : ""}
        </div>
      </div>`);
    }
    return `
      <div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
        <div class="badge"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
        <div class="title">${rcEsc(title)}</div>
        ${chips}
        <button class="pill${allOff ? " action" : ""}" title="${rcEsc(allOff ? this._t("turn_all_off") : status)}"${allOff ? "" : " disabled"}>
          ${allOff ? '<ha-icon icon="mdi:power"></ha-icon>' : ""}<span class="pt">${rcEsc(status)}</span>
        </button>
      </div>`;
  }

  _tile(i, { cls = "", style = "", extra = "", state = i.state, title = `${i.name} — ${i.state}` }) {
    return `
      <button class="tile ${i.unavailable ? "na" : i.on ? "on" : "off"}${cls}" data-id="${rcEsc(i.id)}"
              ${style ? `style="${rcEsc(style)}"` : ""} title="${rcEsc(title)}">
        ${extra}
        <span class="ic"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon></span>
        <span class="txt">
          <span class="name">${rcEsc(i.name)}</span>
          <span class="state">${state}</span>
        </span>
      </button>`;
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile with the keyboard focus keeps it through the redraw (a toggle or a brightness step from the keyboard).
    const focused = this._byPointer ? null : this.shadowRoot.activeElement?.dataset?.id;
    // In place (see rcMorph): the nodes stay, so the card keeps its height and its animations from one update to the
    // next. Their listeners are wired again for the new items, the previous ones dropped (abort signal).
    rcMorph(
      this.shadowRoot,
      `
      <style>${RC_BASE_STYLES}${this._illustrated() ? RC_BANNER_STYLES : ""}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`,
    );
    const root = this.shadowRoot;
    const on = this._rewire();
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev), on);
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path, on);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused && root.activeElement !== el) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    this._fitPill();
  }

  // The listeners of the previous drawing dropped, and the options ({ signal }) of the new ones (`this._on`): the
  // nodes drawn in place are wired again for the items they now show.
  _rewire() {
    this._ac?.abort();
    this._ac = typeof AbortController === "function" ? new AbortController() : null;
    this._on = this._ac ? { signal: this._ac.signal } : undefined;
    return this._on;
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    const on = this._on;
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
    }, on);
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
    }, on);
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
    el.addEventListener(
      "pointerleave",
      () => {
        if (!start || mode) return;
        clearTimeout(timer);
        start = null;
        this._released();
      },
      on,
    );
    el.addEventListener("pointerup", (ev) => end(ev, false), on);
    el.addEventListener("pointercancel", (ev) => end(ev, true), on);
    el.addEventListener("contextmenu", (ev) => ev.preventDefault(), on);
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    }, on);
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    }, on);
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

  // What the header shows, on the full card and the mini card: level, icon, status (`ofTotal`: *2/5 on*) and whether
  // the "turn everything off" button is there. Null when nothing changed, or when the card hides itself.
  _summary(items, ofTotal = false) {
    const c = this._config;
    const lit = items.filter((i) => i.on);
    const level = lit.length ? "on" : "off";
    if (!this._changed([ofTotal, items.map((i) => this._sigOf(i))])) return null;
    if (this._hide(c.hide_when_off && level === "off")) return null;

    const shown = c.only_on ? items.filter((i) => i.on || i.unavailable) : items;
    this._shown = shown.length;
    const [onIcon, offIcon] = this.constructor.headIcons;
    const n = ofTotal ? `${lit.length}/${items.length}` : lit.length;
    const status = lit.length
      ? this._t(rcPluralKey(this.constructor.i18n, this._lang(), "on", lit.length), { n })
      : this._t(items.length ? "all_off" : this.constructor.emptyKey);
    return {
      level,
      shown,
      icon: lit.length ? onIcon : offIcon,
      status: status + this._statusExtra(lit),
      allOff: c.all_off_button && lit.length > 0,
    };
  }

  _draw(items) {
    const s = this._summary(items);
    if (!s) return;
    const head = this._head({ ...s, title: this._config.title || this._areaName() || this._t("title") });
    this._paint(s.level, head, s.shown.map((i) => this._tileOf(i)).join(""));
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
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.hidden ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
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

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      const title = rcEsc(c.title || this._areaName() || this._t("title"));
      const navAttrs = `${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}`;
      // Illustrated: the banner (icon, title and status on the wall, the scene at the right), the chips under it.
      // In place, as the full card (see rcMorph and _paint).
      const html = this._illustrated()
        ? `
        <style>${RC_BASE_STYLES}${RC_BANNER_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          ${this._banner(`<div class="head${navAttrs}>
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="titles"><div class="trow"><div class="title">${title}</div>${st}</div></div>
          </div>`)}
          ${chips.trim() ? `<div class="rs">${chips}</div>` : ""}
        </ha-card>`
        : `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${navAttrs}>
                <div class="title">${title}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      rcMorph(this.shadowRoot, html);
      const root = this.shadowRoot;
      const on = this._rewire();
      if (nav) rcBindNav(root.querySelector(".head"), nav, on);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev), on);
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id), on);
      this._fitPill();
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head) return;
      const title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      // Kept from one drawing to the next (data-rc-own: rcMorph leaves it), brought up to date.
      const kept = head.querySelector(":scope > .zoom");
      if (kept) {
        if (kept.title !== title) kept.title = title;
        const icon = kept.querySelector("ha-icon");
        if (icon && icon.getAttribute("icon") !== rcZoomIcon(this)) icon.setAttribute("icon", rcZoomIcon(this));
        return;
      }
      const button = document.createElement("button");
      button.className = "zoom";
      button.setAttribute?.("data-rc-own", "");
      button.title = title;
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

// Lights and plugs mini cards: the status counts what is on out of the total (*2/5 on*), with the full card's
// "turn everything off" button; then a tinted pill (icon and name) for each entity on, its icon alone for the others.
// The subclass may implement `_chipExtra(item)`, shown after the name (a plug's power draw).
const rcToggleMini = (Base, tag, styles) =>
  class extends rcMini(Base, tag, `${RC_TOGGLE_MINI_STYLES}${styles}`) {
    _chipExtra() {
      return "";
    }

    _drawMini(items) {
      const s = this._summary(items, true);
      if (!s) return;
      const chips = s.shown
        .map((i) => {
          const cls = i.unavailable ? " na" : i.on ? " on pill" : " off";
          const style = i.on && i.color ? ` style="--t:${rcEsc(i.color)}"` : "";
          return `
          <button class="r${cls}" data-id="${rcEsc(i.id)}"${style} title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
            <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${i.on ? `<span>${rcEsc(i.name)}</span>${this._chipExtra(i)}` : ""}
          </button>`;
        })
        .join("");
      this._paintMini({ level: s.level, icon: s.icon, status: s.status, chips, allOff: s.allOff });
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
      this._outside ??= watchOutside(this, this._onOutside);
      this._outside.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._outside?.off();
      // Left (another dashboard view, a conditional card hidden): folded back as by a click elsewhere, so that the
      // card does not come back with a room open, zoomed or its popup open.
      this._beforeFold?.();
      if (this._openArea) this._toggle(null);
      rcUnzoom(this);
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
// Compact tiles (default) or large ones, the size of Home Assistant's Tile card.
const rcLayoutField = (i18n, lang) => ({
  name: "layout",
  selector: {
    select: {
      mode: "dropdown",
      options: ["compact", "tiles"].map((value) => ({ value, label: rcT(i18n, lang, `ed_layout_${value}`) })),
    },
  },
});
const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

// The illustrated header: on or off, day / night / automatic, and (rooms) the room type of the picture.
const RC_SCENE_HELPERS = ["illustration", "illustration_theme", "room_type"];
const rcIllustrationFields = (i18n, lang, roomType = false) => {
  const select = (name, values, prefix) => ({
    name,
    selector: { select: { mode: "dropdown", options: values.map((value) => ({ value, label: rcT(i18n, lang, `${prefix}${value}`) })) } },
  });
  return [
    { name: "illustration", selector: { boolean: {} } },
    select("illustration_theme", ["auto", "day", "night"], "theme_"),
    ...(roomType ? [select("room_type", ["auto", "none", ...RC_ROOM_TYPES], "room_")] : []),
  ];
};

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
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
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

// Per-entity rename: a text field for each entity the card shows, grouped under a `names` map (entity_id → label).
// The field label is the entity's default name, its value the current override; empty keeps the default. Lets the
// `name` that YAML already supports be set graphically, on any of the cards (ha-room-card#81).
const rcRenameField = (card, hass, config) => {
  if (!hass) return [];
  let entries;
  try {
    entries = rcProbe(card, hass, { ...config, names: undefined })._entries();
  } catch {
    return [];
  }
  const seen = new Set();
  const fields = [];
  for (const e of entries || []) {
    const id = e.entity;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    fields.push({ name: id, label: hass.states[id]?.attributes?.friendly_name || id, selector: { text: {} } });
  }
  return fields.length ? [{ name: "names", type: "expandable", flatten: false, schema: fields }] : [];
};

// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, illustration: true, illustration_theme: "auto", room_type: "auto", ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
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
        this._form.computeLabel = (s) => s.label ?? rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) || RC_SCENE_HELPERS.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          if (config.names && typeof config.names === "object") {
            const kept = Object.fromEntries(Object.entries(config.names).filter(([, v]) => v != null && v !== ""));
            if (Object.keys(kept).length) config.names = kept;
            else delete config.names;
          }
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
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
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
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
    display: block;
    min-width: 0;
  }
  :host([hidden]) { display: none !important; }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* The status pill right after the title (8 px), whole, then the header's chips; the detail button at the far end. */
  .head > .title { flex: 0 1 auto; min-width: 0; }
  .head > .pill, .mini .head > .st { flex: none; margin-left: 0; }
  .head > .chip, .head > .hchips { order: 2; }
  .head > .zoom { order: 3; margin-left: auto; }
  /* Not enough room for the whole title and the pill's whole label on one line (measured by the card, see _fitPill):
     the status pill goes to a line of its own under the title (and the chips), where its whole label fits; a label
     too long even there (an empty-state sentence) wraps to a second line rather than being cut. */
  .head[data-wrap] { flex-wrap: wrap; row-gap: 4px; }
  .head[data-wrap] > .title { flex: 1 1 0; }
  .head[data-wrap]::after { content: ""; order: 4; flex: 1 0 100%; }
  .head[data-wrap] > .pill { order: 5; margin-left: 50px; max-width: calc(100% - 50px); border-radius: 10px; }
  .head[data-wrap] > .pill .pt { white-space: normal; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .mini .head[data-wrap] > .st { order: 5; max-width: 100%; }
  @container (max-width: 200px) {
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
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
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

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

// Lights and plugs mini cards: the "turn everything off" status (not filled: tinted on hover, like the zoom button)
// and the chips of the entities that are off (icon alone, grey).
const RC_TOGGLE_MINI_STYLES = `
  .st.action { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative; cursor: pointer;
               display: inline-flex; align-items: center; gap: 3px; margin-left: auto; padding: 1px 6px; border-radius: 999px;
               font-size: 11px; font-weight: 500; color: var(--c); }
  .st.action ha-icon { --mdc-icon-size: 12px; flex: none; }
  .st.action:hover { background: color-mix(in srgb, var(--c) 14%, transparent); }
  .st.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  @container (max-width: 200px) {
    .st.action { width: auto; height: auto; padding: 1px 4px; }
    .st.action::before { content: none; }
  }
  .r.off, .r.na { padding: 0 3px; }
  .r.off ha-icon, .r.na ha-icon { margin-right: 0; }
  .r.off { --t: var(--rc-idle); }
  .r.na  { --t: var(--rc-na); opacity: .7; }
  .r small { flex: none; font-size: 10px; font-weight: 400; opacity: .8; margin-left: 4px; }
`;

// The overviews' room grid: the tiles, their icon, chips row, empty state and details panel. Each overview sets the
// tile's default tint and its own levels (`.room { --t: … }`, `.room.lvl-…`), the chips' spacing and the panel extras.
const RC_ROOM_GRID_STYLES = `
  .grid { display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  @container (max-width: 340px) { .grid:not(.fixed) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  /* A card this narrow (6 columns of the Sections view on a phone): one room per row, whatever the columns option. Two
     left the name a letter or two ("B…") and pushed a chip out of its tile. */
  @container (max-width: 260px) { .grid.grid { grid-template-columns: minmax(0, 1fr); } }
  .grid[hidden] { display: none; }
  .room { all: unset; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: grid; grid-template-columns: 26px minmax(0, 1fr); grid-template-areas: "ic name" "ic state" "chips chips";
          column-gap: 7px; align-items: center; align-content: start; padding: 6px 7px; border-radius: 10px;
          background: var(--secondary-background-color, transparent); border: 1px solid transparent;
          transition: background .2s, border-color .2s; }
  /* Tile B look: the background stays neutral at every level — the state reads from the tinted icon badge, the
     coloured state line and the chips (an alert shows red without tinting the whole tile). */
  .room:hover { background: color-mix(in srgb, var(--t) 13%, var(--secondary-background-color, transparent)); }
  .room:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .room.sel { border-color: color-mix(in srgb, var(--primary-color) 55%, transparent); }
  .room .ic { grid-area: ic; align-self: start; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
              color: var(--t); background: color-mix(in srgb, var(--t) 16%, transparent); }
  .room.lvl-ok .ic { color: var(--primary-text-color); background: color-mix(in srgb, var(--rc-idle) 14%, transparent); }
  .room .ic ha-icon { --mdc-icon-size: 15px; }
  .room .name { grid-area: name; }
  /* The state (a sentence: "Water leak", "Too humid +1") wraps between its words only; a word too long for its line
     ends with "…" rather than being broken ("Pr|es|en|ce"). */
  .room .state { grid-area: state; overflow-wrap: normal; overflow: hidden; text-overflow: ellipsis; }
  .room:not(.lvl-ok) .state { color: var(--t); }
  .chips { grid-area: chips; display: flex; flex-wrap: wrap; }
  .chips:empty { display: none; }
  .empty { grid-column: 1 / -1; padding: 12px; text-align: center; font-size: 13px; color: var(--secondary-text-color); }
  .panel { margin-top: 8px; border-radius: 12px; overflow: hidden; background: var(--secondary-background-color, transparent);
           --ha-card-background: transparent; --card-background-color: transparent;
           --ha-card-box-shadow: none; --ha-card-border-width: 0; }
  .panel[hidden] { display: none; }
  /* The unfolded room cards are custom elements with no display of their own: inline, the separator between them
     (border-top) would only paint on an empty first line box around their block <ha-card>. */
  .panel > * { display: block; }
  @media (prefers-reduced-motion: reduce) { .room { animation: none; transition: none; } }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 18px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;

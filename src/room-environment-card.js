/**
 * room-environment-card — temperature, humidity, air quality, noise and light level of a Home Assistant area.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RE_I18N = {
  en: {
    ed_columns_helper: "Mini card: columns of the zoomed-in view",
    title: "Environment",
    no_sensors: "No sensor",
    comfortable: "Comfortable",
    k_temperature: "Temperature",
    k_humidity: "Humidity",
    k_co2: "CO2",
    k_pm25: "PM2.5",
    k_pm10: "PM10",
    k_voc: "VOC",
    k_aqi: "Air quality",
    k_noise: "Noise",
    k_illuminance: "Light",
    b_temperature: ["Cold", "Cool", "Comfortable", "Warm", "Hot"],
    b_humidity: ["Very dry", "Dry", "Comfortable", "Humid", "Very humid"],
    b_air: ["", "", "Good", "Moderate", "Poor"],
    b_noise: ["", "", "Quiet", "Noisy", "Very noisy"],
    b_illuminance: ["Dark", "Dim", "Bright"],
    i_temperature: ["Too cold", "Too hot"],
    i_humidity: ["Too dry", "Too humid"],
    i_co2: ["", "Ventilate"],
    i_air: ["", "Poor air"],
    i_noise: ["", "Noisy"],
    ed_navigation_path_helper: "Dashboard opened when tapping the title, e.g. /dashboard-home/living-room",
    ed_only_alerts: "Hide comfortable readings",
    ed_only_alerts_helper: "Only the readings outside the comfort range stay visible",
    ed_show_gauge: "Show gauges",
    ed_show_gauge_helper: "A thin bar under each reading, coloured by its level",
    ed_include: "Sensors to add",
    ed_include_helper: "From another room or without one",
    ed_exclude: "Sensors to exclude",
  },
  fr: {
    ed_columns_helper: "Mini-carte : colonnes de la vue zoomée",
    title: "Environnement",
    no_sensors: "Aucun capteur",
    comfortable: "Confortable",
    k_temperature: "Température",
    k_humidity: "Humidité",
    k_co2: "CO2",
    k_pm25: "PM2,5",
    k_pm10: "PM10",
    k_voc: "COV",
    k_aqi: "Qualité de l'air",
    k_noise: "Bruit",
    k_illuminance: "Luminosité",
    b_temperature: ["Froid", "Frais", "Confortable", "Chaud", "Très chaud"],
    b_humidity: ["Très sec", "Sec", "Confortable", "Humide", "Très humide"],
    b_air: ["", "", "Bon", "Moyen", "Mauvais"],
    b_noise: ["", "", "Calme", "Bruyant", "Très bruyant"],
    b_illuminance: ["Sombre", "Tamisé", "Lumineux"],
    i_temperature: ["Trop froid", "Trop chaud"],
    i_humidity: ["Trop sec", "Trop humide"],
    i_co2: ["", "Aérer"],
    i_air: ["", "Air pollué"],
    i_noise: ["", "Bruyant"],
    ed_navigation_path_helper: "Tableau de bord ouvert au tap sur le titre, par exemple /dashboard-maison/salon",
    ed_only_alerts: "Masquer les mesures confortables",
    ed_only_alerts_helper: "Seules les mesures hors de la plage de confort restent affichées",
    ed_show_gauge: "Afficher les jauges",
    ed_show_gauge_helper: "Une fine barre sous chaque mesure, colorée selon son niveau",
    ed_include: "Capteurs à ajouter",
    ed_include_helper: "D'une autre pièce ou sans pièce",
    ed_exclude: "Capteurs à exclure",
  },
};

// ── Sensor kinds ─────────────────────────────────────────────────────────────
// `dc`: device classes · `scale`: [alert low, warn low, warn high, alert high] in `unit` (null: no low side)
// · `gauge`: range of the bar · `words` / `issue`: label families (b_* / i_*) · `sev`: severity of the five bands
// · `cold`: bands tinted blue. A kind without `scale` (light level) is information only.
const RE_SEV = ["alert", "warn", "ok", "warn", "alert"];
const RE_KINDS = {
  temperature: {
    dc: ["temperature"],
    unit: "°C",
    scale: [16, 18, 25, 28],
    gauge: [10, 35],
    digits: 1,
    words: "temperature",
    issue: "temperature",
    sev: ["warn", "info", "ok", "warn", "alert"],
    cold: [0, 1],
    icon: "mdi:thermometer",
    icons: ["mdi:snowflake-thermometer", "mdi:thermometer-low", "mdi:thermometer", "mdi:thermometer-high", "mdi:thermometer-alert"],
  },
  humidity: {
    dc: ["humidity"],
    unit: "%",
    scale: [25, 35, 60, 70],
    gauge: [0, 100],
    digits: 0,
    words: "humidity",
    issue: "humidity",
    icon: "mdi:water-percent",
    icons: ["mdi:water-percent-alert", "mdi:water-percent", "mdi:water-percent", "mdi:water-percent", "mdi:water-percent-alert"],
  },
  co2: {
    dc: ["carbon_dioxide"],
    unit: "ppm",
    scale: [null, null, 1000, 1500],
    gauge: [400, 2000],
    digits: 0,
    words: "air",
    issue: "co2",
    icon: "mdi:molecule-co2",
  },
  pm25: { dc: ["pm25"], unit: "µg/m³", scale: [null, null, 15, 35], gauge: [0, 75], digits: 0, words: "air", issue: "air", icon: "mdi:blur" },
  pm10: { dc: ["pm10"], unit: "µg/m³", scale: [null, null, 45, 100], gauge: [0, 150], digits: 0, words: "air", issue: "air", icon: "mdi:blur-radial" },
  voc: {
    dc: ["volatile_organic_compounds", "volatile_organic_compounds_parts"],
    unit: "µg/m³",
    scale: [null, null, 300, 1000],
    gauge: [0, 1500],
    // Same levels in parts: 220 / 660 ppb.
    units: { ppb: [220, 660, 1000], ppm: [0.22, 0.66, 1] },
    digits: 0,
    words: "air",
    issue: "air",
    icon: "mdi:scent",
  },
  aqi: { dc: ["aqi"], unit: "", scale: [null, null, 100, 150], gauge: [0, 300], digits: 0, words: "air", issue: "air", icon: "mdi:air-filter" },
  noise: {
    dc: ["sound_pressure"],
    unit: "dB",
    // Noisy from 70 dB (vacuum, loud TV), very noisy from 85 dB (the level where long exposure harms hearing):
    // conversation and everyday sounds (40 to 65 dB) stay quiet.
    scale: [null, null, 70, 85],
    gauge: [20, 100],
    digits: 0,
    words: "noise",
    issue: "noise",
    icon: "mdi:volume-medium",
    icons: [null, null, "mdi:volume-low", "mdi:volume-high", "mdi:volume-high"],
  },
  illuminance: {
    dc: ["illuminance"],
    unit: "lx",
    // Dark below 10 lx, dim below 200 lx.
    steps: [10, 200],
    gauge: [0, 1000],
    digits: 0,
    words: "illuminance",
    icon: "mdi:brightness-5",
    icons: ["mdi:brightness-3", "mdi:brightness-5", "mdi:brightness-7"],
  },
};
const RE_ORDER = Object.keys(RE_KINDS);
const RE_DC = Object.fromEntries(RE_ORDER.flatMap((k) => RE_KINDS[k].dc.map((dc) => [dc, k])));
const RE_RANK = { ok: 0, info: 1, warn: 2, alert: 3 };

const reKindOf = (st) => RE_DC[st?.attributes.device_class];

// Environment sensors of the card: a known device class, configuration and diagnostic entities excepted
// (a battery or a CPU temperature, say).
const reMatch = (hass, id) =>
  id.startsWith("sensor.") && !hass.entities?.[id]?.entity_category && !!reKindOf(hass.states[id]);

// Wet rooms (bathroom, shower room, laundry) live with more humidity: 70 % is a warning there, 80 % an alert.
const RE_WET_ROOM = /salle (de )?bains?|salle d.eau|douche|bath|shower|buanderie|laundry/i;
const RE_WET_HUMIDITY = [25, 35, 70, 80];

// Outdoor areas (terrace, garden, balcony…): their temperature, humidity and noise are the weather and the street, not
// a comfort issue, so they are information only, unless the user set thresholds for them.
const RE_OUTDOOR_ROOM = /terrasse|jardin|balcon|patio|ext[ée]rieur|cour\b|garden|terrace|balcony|outdoor|outside|yard/i;
const RE_OUTDOOR_KINDS = ["temperature", "humidity", "noise"];
const reOutdoorInfo = (kind, room) =>
  RE_OUTDOOR_KINDS.includes(kind) && !room.thresholds?.[kind] && RE_OUTDOOR_ROOM.test(room.name || "");

// Thresholds of `kind` for a room: the room's own, then the card's, then the wet-room humidity, then the defaults.
const reCustom = (kind, room) =>
  room.thresholds?.[kind] ?? (kind === "humidity" && RE_WET_ROOM.test(room.name || "") ? RE_WET_HUMIDITY : undefined);

// Thresholds and gauge of `kind` in the sensor's unit: °F and parts per billion are converted, custom thresholds
// (`thresholds: { co2: [800, 1200] }`, two values for a one-sided kind, four otherwise) are used as they are.
const reScale = (kind, unit, custom) => {
  const k = RE_KINDS[kind];
  if (Array.isArray(custom) && custom.length) {
    const scale = custom.length === 2 ? [null, null, ...custom] : custom;
    if (scale.length === 4 && scale.every((v) => v === null || Number.isFinite(Number(v)))) {
      return { scale: scale.map((v) => (v === null ? null : Number(v))), gauge: k.gauge };
    }
  }
  if (kind === "temperature" && /F$/.test(unit || "")) {
    const f = (c) => (c === null ? null : (c * 9) / 5 + 32);
    return { scale: k.scale.map(f), gauge: k.gauge.map(f) };
  }
  const parts = k.units?.[unit];
  if (parts) return { scale: [null, null, parts[0], parts[1]], gauge: [0, parts[2] * 1.5] };
  return { scale: k.scale, gauge: k.gauge };
};

// Band of a value: 0 alert low, 1 warn low, 2 comfortable, 3 warn high, 4 alert high.
const reBand = (v, [al, wl, wh, ah]) => {
  if (al !== null && v < al) return 0;
  if (wl !== null && v < wl) return 1;
  if (ah !== null && v >= ah) return 4;
  if (wh !== null && v >= wh) return 3;
  return 2;
};

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomEnvironmentCard extends RcCard {
  static tag = "room-environment-card";
  static i18n = RE_I18N;
  static needsArea = true;
  static includeDomains = ["sensor"];
  static includeMatch = (hass, id) => !!reKindOf(hass.states[id]);
  static defaults = { columns: 2, only_alerts: false, show_gauge: true, exclude: [] };

  _candidate(id) {
    return reMatch(this._hass, id);
  }

  _words(family) {
    const w = RE_I18N[this._lang()]?.[`b_${family}`] ?? RE_I18N.en[`b_${family}`];
    return w;
  }

  // The value as Home Assistant shows it (number format, display precision), or formatted here for an older HA.
  _format(st, kind) {
    if (typeof this._hass.formatEntityState === "function") return this._hass.formatEntityState(st);
    const digits = this._hass.entities?.[st.entity_id]?.display_precision ?? RE_KINDS[kind].digits;
    return this._formatNumber(Number.parseFloat(st.state), digits, st.attributes.unit_of_measurement);
  }

  _formatNumber(value, digits, unit) {
    const n = new Intl.NumberFormat(this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    return unit ? `${n} ${unit}` : n;
  }

  // One reading per kind: the mean of the sensors of that kind that report a number, unavailable and unknown ones
  // ignored (a kind with none left is not shown). A single sensor keeps Home Assistant's formatting and its
  // `name` / `icon` overrides; a mean is formatted with the kind's precision.
  _reading(kind, members, room) {
    const k = RE_KINDS[kind];
    const values = members.map((m) => Number.parseFloat(m.st.state));
    const value = values.reduce((t, v) => t + v, 0) / values.length;
    const [first] = members;
    const single = members.length === 1;
    const unit = first.st.attributes.unit_of_measurement;
    const item = {
      id: first.e.entity,
      ids: members.map((m) => m.e.entity),
      kind,
      name: (single && first.e.name) || this._t(`k_${kind}`),
      on: true,
      sev: "ok",
      cold: false,
      num: value,
      unit,
    };
    let band;
    let gauge;
    if (k.steps) {
      band = value < k.steps[0] ? 0 : value < k.steps[1] ? 1 : 2;
      gauge = k.gauge;
      item.light = band > 0;
    } else {
      const sc = reScale(kind, unit, reCustom(kind, room));
      band = reBand(value, sc.scale);
      gauge = sc.gauge;
      if (!reOutdoorInfo(kind, room)) {
        item.sev = (k.sev ?? RE_SEV)[band];
        item.cold = !!k.cold?.includes(band);
      }
    }
    const text = single ? this._format(first.st, kind) : this._formatNumber(value, k.digits, unit);
    const word = this._words(k.words)[band];
    return {
      ...item,
      band,
      value: text,
      word,
      state: word ? `${text} · ${word}` : text,
      icon: (single && first.e.icon) || k.icons?.[band] || k.icon,
      pct: Math.round(Math.min(1, Math.max(0, (value - gauge[0]) / (gauge[1] - gauge[0]))) * 100),
    };
  }

  _collect() {
    return this._itemsOf(this._entries(), { name: this._areaName(), thresholds: this._config.thresholds });
  }

  // The readings of `entries`, one per kind, in kind order; also used by the overview, room by room.
  // `room`: { name, thresholds } of the room, for its comfort limits.
  _itemsOf(entries, room) {
    const byKind = {};
    for (const e of entries) {
      const st = this._hass.states[e.entity];
      const kind = reKindOf(st);
      if (kind && !rcUnavailable(st) && Number.isFinite(Number.parseFloat(st.state))) (byKind[kind] ||= []).push({ e, st });
    }
    return RE_ORDER.filter((kind) => byKind[kind]).map((kind) => this._reading(kind, byKind[kind], room));
  }

  // Number in full, unit small and muted ("°" for a temperature) to keep the chips short.
  _chipValue(i) {
    if (i.value == null) return "<span>—</span>";
    const unit = i.unit || "";
    const num = unit && i.value.endsWith(unit) ? i.value.slice(0, -unit.length).trim() : i.value;
    const short = /^°[CF]$/.test(unit) ? "°" : unit;
    return `<span>${rcEsc(num)}</span>${short && num !== i.value ? `<small>${rcEsc(short)}</small>` : ""}`;
  }

  // The reading that needs a look first: the highest severity, then the kind order.
  _worst(items) {
    return items.reduce((w, i) => (RE_RANK[i.sev] > RE_RANK[w?.sev ?? "ok"] ? i : w), null);
  }

  _status(items, worst) {
    if (!items.length) return this._t("no_sensors");
    if (!worst) return this._t("comfortable");
    if (worst.sev === "info") return worst.word;
    const issues = items.filter((i) => RE_RANK[i.sev] >= RE_RANK.warn).length;
    const family = RE_KINDS[worst.kind].issue;
    const text = (RE_I18N[this._lang()]?.[`i_${family}`] ?? RE_I18N.en[`i_${family}`])[worst.band > 2 ? 1 : 0];
    return issues > 1 ? `${text} +${issues - 1}` : text;
  }

  _headIcon(worst) {
    if (!worst) return "mdi:home-thermometer-outline";
    if (worst.kind === "pm25" || worst.kind === "pm10" || worst.kind === "voc") return "mdi:air-filter";
    return worst.icon;
  }

  _draw(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold ? "cold" : worst.sev) : "ok";

    if (!this._changed(items.map((i) => [i.id, i.name, i.icon, i.state, i.sev, i.cold, i.pct]))) return;

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok") : items;
    this._shown = shown.length;
    const tiles = shown
      .map((i) =>
        this._tile(i, {
          cls: ` k-${i.kind} s-${i.sev}${i.cold ? " cold" : ""}${i.light ? " lit" : ""}`,
          extra: c.show_gauge && i.pct != null ? `<span class="gauge"><span style="width:${i.pct}%"></span></span>` : "",
          // The comfort word only when the reading needs a look (and for the light level): shorter tiles.
          state: i.word && (i.sev !== "ok" || i.kind === "illuminance")
            ? `<span class="val">${rcEsc(i.value)}</span> · ${rcEsc(i.word)}`
            : `<span class="val">${rcEsc(i.value ?? i.state)}</span>`,
        }),
      )
      .join("");
    const head = this._head({
      icon: this._headIcon(worst),
      title: c.title || this._areaName() || this._t("title"),
      status: this._status(items, worst),
    });
    this._paint(level === "info" ? "cold" : level, head, tiles);
  }

  // A tap opens the details (history graph): a reading cannot be toggled.
  _bindTile(el) {
    el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
  }

  static styles = `
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-cold  { --c: var(--rc-info); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }
    .tile { --t: var(--rc-ok); }
    .tile.s-warn  { --t: var(--rc-warn); }
    .tile.s-alert { --t: var(--rc-alert); }
    .tile.cold    { --t: var(--rc-info); }
    .tile.k-illuminance     { --t: var(--rc-idle); }
    .tile.k-illuminance.lit { --t: var(--rc-light); }
    /* Only what needs a look is tinted: comfortable readings and the light level stay neutral. */
    .tile.s-ok { background: var(--secondary-background-color, transparent); border-color: transparent; }
    .val { color: var(--primary-text-color); font-weight: 600; }
    .tile.s-warn .state, .tile.s-alert .state, .tile.cold .state { color: var(--t); }
    .tile.s-warn .val, .tile.s-alert .val, .tile.cold .val { color: inherit; }
    /* Drawn in the bottom padding of the tile: no extra height. */
    .gauge { position: absolute; inset: auto 8px 2px 41px; height: 2px; border-radius: 1px; pointer-events: none;
             background: color-mix(in srgb, var(--t) 16%, transparent); }
    .gauge > span { display: block; height: 100%; border-radius: inherit; background: var(--t); transition: width .4s; }
    @media (prefers-reduced-motion: reduce) { .gauge > span { transition: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const RoomEnvironmentCardEditor = rcEditor({
  card: RoomEnvironmentCard,
  helpers: ["title", "navigation_path", "only_alerts", "show_gauge", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_alerts", "show_gauge"),
    ...rcIncludeField(RoomEnvironmentCard, hass, config),
    ...rcExcludeField(RoomEnvironmentCard, hass, config),
    ...rcAdvanced(RE_I18N, lang, "thresholds", "entities", "language"),
  ],
});

rcRegister(
  RoomEnvironmentCard,
  RoomEnvironmentCardEditor,
  "Room Environment Card",
  "Temperature, humidity, air quality, noise and light level of a room, coloured by comfort",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The room on two lines: the badge, title and status, then one chip per reading (icon and value), tinted only when
// the reading needs a look. The zoom button switches to the full Environment card (tiles and gauges) and back.
// `columns` and `show_gauge` only shape the zoomed-in view.
class RoomEnvironmentMiniCard extends rcMini(
  RoomEnvironmentCard,
  "room-environment-mini-card",
  `
    .r small { font-size: 10px; font-weight: 400; opacity: .7; margin-left: 1px; }
    .r.s-warn  { --t: var(--rc-warn); }
    .r.s-alert { --t: var(--rc-alert); }
    .r.cold    { --t: var(--rc-info); }
    .r.k-illuminance     { --t: var(--rc-idle); }
    .r.k-illuminance.lit { --t: var(--rc-light); }
  `,
) {
  _drawMini(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok";
    if (!this._changed(["mini", items.map((i) => [i.id, i.icon, i.state, i.sev, i.cold])])) return;

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
    this._paintMini({ level, icon: this._headIcon(worst), status: this._status(items, worst), chips });
  }
}

const RoomEnvironmentMiniCardEditor = rcEditor({
  card: RoomEnvironmentMiniCard,
  helpers: ["title", "navigation_path", "columns", "only_alerts", "show_gauge", "zoom", "include", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_alerts", "zoom", "show_gauge"),
    ...rcIncludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcExcludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcAdvanced(RE_I18N, lang, "thresholds", "entities", "language"),
  ],
});

rcRegister(
  RoomEnvironmentMiniCard,
  RoomEnvironmentMiniCardEditor,
  "Room Environment Mini Card",
  "The environment readings of a room on a single line: one chip per reading, tinted when it needs a look",
);

// ── Overview card ────────────────────────────────────────────────────────────
// Every room with environment sensors, one tile per room: its status and its main readings. Tap a room to unfold
// its Environment card.
const REO_I18N = {
  en: {
    ...RE_I18N.en,
    title: "Indoor climate",
    check_one: "{n} to check",
    check_many: "{n} to check",
    no_rooms: "No room with environment sensors",
    readings: "Readings",
    averages: "Average temperature and humidity",
    ed_title_helper: "Leave empty for “Indoor climate”",
    ed_columns_helper: "Empty: 3, or 2 on narrow screens",
    ed_zoom: "Detail button",
    ed_zoom_helper: "Only the rooms with a reading outside the comfort range show; the button shows every room. Off: every room, always",
    ed_sort: "Sort",
    ed_sort_name: "By name",
    ed_sort_state: "Rooms needing a look first",
    ed_exclude_areas: "Rooms to exclude",
    ed_exclude_helper: "Left out of the tiles, the averages and the room details",
  },
  fr: {
    ...RE_I18N.fr,
    title: "Climat intérieur",
    check_one: "{n} à surveiller",
    check_many: "{n} à surveiller",
    no_rooms: "Aucune pièce avec des capteurs d'environnement",
    readings: "Mesures",
    averages: "Température et humidité moyennes",
    ed_title_helper: "Laisser vide pour « Climat intérieur »",
    ed_columns_helper: "Vide : 3, ou 2 sur les écrans étroits",
    ed_zoom: "Bouton détail",
    ed_zoom_helper: "Seules les pièces avec une mesure hors de la plage de confort s'affichent ; le bouton affiche toutes les pièces. Désactivé : toujours toutes les pièces",
    ed_sort: "Tri",
    ed_sort_name: "Par nom",
    ed_sort_state: "Pièces à surveiller en premier",
    ed_exclude_areas: "Pièces à exclure",
    ed_exclude_helper: "Ignorés dans les tuiles, les moyennes et le détail des pièces",
  },
};

// Readings always shown on a room tile; the others only when they need a look.
const REO_MAIN = ["temperature", "humidity", "co2"];

class RoomEnvironmentOverviewCard extends RoomEnvironmentCard {
  static tag = "room-environment-overview-card";
  static i18n = REO_I18N;
  static needsArea = false;
  static defaults = { zoom: true, sort: "name", exclude_areas: [], exclude: [], rooms: [] };

  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    // A click anywhere else folds the open room back, and returns to the rooms needing a look.
    this._onOutside = (ev) => {
      if (!rcOutside(this, ev)) return;
      if (this._openArea) this._toggle(null);
      rcUnzoom(this);
    };
  }

  setConfig(config) {
    this._panelArea = null;
    super.setConfig(config);
  }

  set hass(hass) {
    super.hass = hass;
    if (this._detail) this._detail.hass = hass;
  }

  connectedCallback() {
    document.addEventListener("click", this._onOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
  }

  getCardSize() {
    return 1 + Math.ceil((this._items?.length || 1) / 3);
  }

  _collect() {
    const h = this._hass;
    const c = this._config;
    const excluded = new Set(c.exclude_areas || []);
    const overrides = Object.fromEntries((c.rooms || []).map((x) => [x.area, x]));
    const byArea = {};
    for (const [id, aid] of rcByArea(this, (id) => id.startsWith("sensor."))) (byArea[aid] ||= []).push(id);
    const rooms = [];
    for (const [aid, ids] of Object.entries(byArea)) {
      const area = h.areas?.[aid];
      const entries = ids.filter((id) => h.states[id] && reMatch(h, id)).map((entity) => ({ entity }));
      const o = overrides[aid] || {};
      const thresholds = this._roomThresholds(o);
      const items = area && !excluded.has(aid) ? this._itemsOf(entries, { name: area.name, thresholds }) : [];
      if (!items.length) continue;
      const worst = this._worst(items);
      rooms.push({
        id: aid,
        name: o.name ?? area.name ?? aid,
        icon: o.icon ?? rcRoomIcon(area),
        navigation_path: o.navigation_path,
        items,
        worst,
        rank: worst ? RE_RANK[worst.sev] : 0,
        level: worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok",
        status: this._status(items, worst),
      });
    }
    rcSortRooms(rooms, c, (x) => x.rank);
    this._total = rooms.length;
    this._everyRoom = rooms; // the header averages count every room, shown or not
    return rcCompact(this) ? rooms.filter((x) => x.rank >= RE_RANK.warn || x.id === this._openArea) : rooms;
  }

  // Mean of the rooms' readings of `kind` (each room counting once), formatted with `digits`.
  _average(rooms, kind, digits) {
    const values = rooms.map((x) => x.items.find((i) => i.kind === kind)?.num).filter((v) => v != null);
    if (!values.length) return null;
    const mean = values.reduce((t, v) => t + v, 0) / values.length;
    return new Intl.NumberFormat(this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(mean);
  }

  _chip(i) {
    const cls = `chip s-${i.sev}${i.cold ? " cold" : ""}`;
    return `<span class="${cls}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${this._chipValue(i)}</span>`;
  }

  // The base card's render collects the rooms (`_collect`) and hands them here.
  _draw(rooms) {
    const c = this._config;
    const parts = rooms.map((x) => [x.id, x.name, x.icon, x.status, x.items.map((i) => [i.id, i.state, i.sev, i.cold])]);
    if (!this._changed([this._openArea, this._zoomed, parts])) return;

    if (!this.shadowRoot.querySelector("ha-card")) {
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${RoomEnvironmentOverviewCard.styles}</style>
        <ha-card><div class="head"></div><div class="panel" hidden></div><div class="grid"></div></ha-card>`;
      this.shadowRoot.querySelector(".grid").addEventListener("click", (ev) => {
        const tile = ev.target.closest(".room");
        if (tile) this._tap(tile.dataset.area);
      });
      this.shadowRoot.querySelector(".head").addEventListener("click", (ev) => rcZoomClick(this, ev));
    }

    const all = this._everyRoom || [];
    const worst = this._worst(rooms.map((x) => x.worst).filter(Boolean));
    const level = worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok";
    const toCheck = rooms.filter((x) => x.rank >= RE_RANK.warn).length;
    const status = !this._total
      ? this._t("no_rooms")
      : toCheck
        ? this._t(toCheck > 1 ? "check_many" : "check_one", { n: toCheck })
        : worst
          ? worst.word
          : this._t("comfortable");
    const temp = this._average(all, "temperature", 1);
    const hum = this._average(all, "humidity", 0);
    // One chip for the home averages: "21,0° · 53 %".
    const avgText = [temp && `${temp}°`, hum && `${hum} %`].filter(Boolean).join(" · ");
    const avg = avgText
      ? `<span class="chip avg" title="${rcEsc(this._t("averages"))}"><ha-icon icon="mdi:home-thermometer-outline"></ha-icon><span>${rcEsc(avgText)}</span></span>`
      : "";

    const card = this.shadowRoot.querySelector("ha-card");
    card.className = `lvl-${level}`;
    card.querySelector(".head").innerHTML = `
      <div class="badge"><ha-icon icon="${this._headIcon(worst)}"></ha-icon></div>
      <div class="title">${rcEsc(c.title || this._t("title"))}</div>
      ${avg}
      <div class="pill">${rcEsc(status)}</div>
      ${rcZoomButton(this)}`;

    this._roomGrid(card.querySelector(".grid"), rooms, (x) => {
      const chips = x.items
        .filter((i) => REO_MAIN.includes(i.kind) || RE_RANK[i.sev] >= RE_RANK.warn)
        .map((i) => this._chip(i))
        .join("");
      return `
      <button class="room lvl-${x.level}${x.id === this._openArea ? " sel" : ""}" data-area="${rcEsc(x.id)}"
              title="${rcEsc(x.name)} — ${rcEsc(x.status)}">
        <span class="ic"><ha-icon icon="${rcEsc(x.icon)}"></ha-icon></span>
        <span class="name">${rcEsc(x.name)}</span>
        <span class="state">${rcEsc(x.status)}</span>
        <span class="chips">${chips}</span>
      </button>`;
    });
  }

  _tap(aid) {
    const x = this._items.find((r) => r.id === aid);
    if (x?.navigation_path) rcNavigate(x.navigation_path);
    else this._toggle(this._openArea === aid ? null : aid);
  }

  _toggle(aid) {
    this._openArea = aid;
    this._sig = null;
    this._render();
    if (aid) return;
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = true;
    panel.innerHTML = "";
    this._panelArea = null;
    this._detail = null;
  }

  // The card's `thresholds` with the room's own (`rooms: [{ area, thresholds }]`) on top.
  _roomThresholds(override) {
    const t = { ...this._config.thresholds, ...override?.thresholds };
    return Object.keys(t).length ? t : undefined;
  }

  // The Environment card of the open room, built once per room.
  _fillPanel() {
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = false;
    if (this._panelArea === this._openArea) return;
    this._panelArea = this._openArea;
    const c = this._config;
    const thresholds = this._roomThresholds((c.rooms || []).find((x) => x.area === this._openArea));
    const el = document.createElement(RoomEnvironmentCard.tag);
    el.setConfig({
      type: `custom:${RoomEnvironmentCard.tag}`,
      area: this._openArea,
      title: this._t("readings"),
      exclude: c.exclude || [],
      ...(thresholds ? { thresholds } : {}),
      ...(c.language ? { language: c.language } : {}),
    });
    el.hass = this._hass;
    panel.innerHTML = "";
    panel.appendChild(el);
    this._detail = el;
  }

  static styles = `${RC_ZOOM_STYLES}
    ha-card { container-type: inline-size; }
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-cold  { --c: var(--rc-info); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }

    /* Comfortable readings are plain text, the ones needing a look a tinted pill (as on the mini card). */
    .chip { --k: var(--rc-ok); flex: none; display: inline-flex; align-items: baseline; gap: 1px; height: 18px; padding: 0 4px 0 3px;
            border-radius: 999px; font-size: 11px; font-weight: 500; line-height: 18px; white-space: nowrap;
            color: var(--primary-text-color); }
    .chip ha-icon { --mdc-icon-size: 12px; color: var(--k); align-self: center; margin-right: 1px; }
    .chip small { font-size: 9px; opacity: .7; margin-left: 1px; }
    .chip.s-warn  { --k: var(--rc-warn); }
    .chip.s-alert { --k: var(--rc-alert); }
    .chip.cold    { --k: var(--rc-info); }
    .chip.s-warn, .chip.s-alert, .chip.cold.s-info, .chip.cold.s-warn {
      color: var(--k); background: color-mix(in srgb, var(--k) 14%, transparent); }
    .head .chip.avg { --k: var(--secondary-text-color); height: 20px; padding: 0 6px; color: var(--secondary-text-color);
                      background: color-mix(in srgb, var(--rc-idle) 12%, transparent); }
    @container (max-width: 340px) { .head { gap: 6px; } .head .chip.avg { display: none; } }

    .grid { display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
    @container (max-width: 340px) { .grid:not(.fixed) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .grid[hidden] { display: none; }
    .room { --t: var(--rc-ok); all: unset; box-sizing: border-box; cursor: pointer; min-width: 0;
            display: grid; grid-template-columns: 26px minmax(0, 1fr); grid-template-areas: "ic name" "ic state" "chips chips";
            column-gap: 7px; align-items: center; align-content: start; padding: 6px 7px; border-radius: 10px;
            background: var(--secondary-background-color, transparent); border: 1px solid transparent;
            transition: background .2s, border-color .2s; }
    .room.lvl-cold  { --t: var(--rc-info); }
    .room.lvl-warn  { --t: var(--rc-warn); }
    .room.lvl-alert { --t: var(--rc-alert); }
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
    .chips { grid-area: chips; display: flex; flex-wrap: wrap; gap: 1px 2px; margin: 3px 0 0 -3px; }
    .chips:empty { display: none; }
    .empty { grid-column: 1 / -1; padding: 12px; text-align: center; font-size: 13px; color: var(--secondary-text-color); }

    .panel { margin-top: 8px; border-radius: 12px; overflow: hidden; background: var(--secondary-background-color, transparent);
             --ha-card-background: transparent; --card-background-color: transparent;
             --ha-card-box-shadow: none; --ha-card-border-width: 0; }
    .panel[hidden] { display: none; }
    @media (prefers-reduced-motion: reduce) { .room { transition: none; } }
  `;
}

const RoomEnvironmentOverviewCardEditor = rcEditor({
  card: RoomEnvironmentOverviewCard,
  helpers: ["title", "columns", "zoom", "exclude", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => {
    const probe = hass && rcProbe(RoomEnvironmentOverviewCard, hass, { ...config, exclude_areas: [], exclude: [], zoom: false });
    const rooms = probe ? probe._collect() : [];
    const ids = rooms.flatMap((x) => x.items.map((i) => i.id));
    for (const id of config?.exclude || []) if (!ids.includes(id)) ids.push(id);
    return [
      ...rcOverviewFields(REO_I18N, lang),
      ...rcBooleans("zoom"),
      {
        name: "exclude_areas",
        selector: { select: { multiple: true, mode: "dropdown", options: rooms.map((x) => ({ value: x.id, label: x.name })) } },
      },
      ...rcEntitiesField("exclude", ids),
      ...rcAdvanced(REO_I18N, lang, "thresholds", "rooms", "language"),
    ];
  },
});

rcRegister(
  RoomEnvironmentOverviewCard,
  RoomEnvironmentOverviewCardEditor,
  "Room Environment Overview Card",
  "The indoor climate of every room at a glance: temperature, humidity, CO₂ and what needs a look; tap a room for its readings",
);

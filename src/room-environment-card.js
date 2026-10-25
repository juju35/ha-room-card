/**
 * room-environment-card — temperature, humidity, air quality, noise and light level of a Home Assistant area.
 * Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RE_I18N = {
  en: {
    title: "Environment",
    no_sensors: "No sensor",
    comfortable: "Comfortable",
    k_temperature: "Temperature",
    k_humidity: "Humidity",
    k_co2: "CO₂",
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
    title: "Environnement",
    no_sensors: "Aucun capteur",
    comfortable: "Confortable",
    k_temperature: "Température",
    k_humidity: "Humidité",
    k_co2: "CO₂",
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
    scale: [null, null, 55, 70],
    gauge: [20, 90],
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

// "Capteur Salon Température" in Salon → "", "Netatmo Indoor Temperature" → "Netatmo Indoor"
const RE_PREFIX = /^(capteur|sensor)\s+/i;
const RE_SUFFIX =
  /\s+(temp[ée]rature|humidit[ée]|humidity|co2|dioxyde de carbone|carbon dioxide|pm2[.,]?5|pm10|cov|voc|aqi|qualit[ée] de l.air|air quality|bruit|noise|niveau sonore|sound pressure|luminosit[ée]|lumi[eè]re|illuminance|light level)$/i;

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
    const n = new Intl.NumberFormat(this._lang(), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
      Number.parseFloat(st.state),
    );
    const unit = st.attributes.unit_of_measurement;
    return unit ? `${n} ${unit}` : n;
  }

  _item(e, areaName, dupes) {
    const st = this._hass.states[e.entity];
    const kind = reKindOf(st) ?? "aqi";
    const k = RE_KINDS[kind];
    const value = Number.parseFloat(st.state);
    const unavailable = rcUnavailable(st) || !Number.isFinite(value);
    const label = this._t(`k_${kind}`);
    const own = rcCleanName(st.attributes.friendly_name, areaName, RE_PREFIX, RE_SUFFIX);
    // The kind is enough, unless the room has several sensors of that kind: then the rest of their own name too.
    const distinct = own && own !== label && own.toLowerCase() !== areaName.toLowerCase();
    const name = e.name ?? (dupes.has(kind) && distinct ? `${label} · ${own}` : label);
    const item = { id: e.entity, kind, name, unavailable, on: !unavailable, sev: "ok", band: 2 };
    if (unavailable) return { ...item, icon: e.icon ?? k.icon, state: this._t("unavailable"), value: null };

    const unit = st.attributes.unit_of_measurement;
    let band;
    let gauge;
    if (k.steps) {
      band = value < k.steps[0] ? 0 : value < k.steps[1] ? 1 : 2;
      gauge = k.gauge;
      item.light = band > 0;
    } else {
      const s = reScale(kind, unit, this._config.thresholds?.[kind]);
      band = reBand(value, s.scale);
      gauge = s.gauge;
      item.sev = (k.sev ?? RE_SEV)[band];
      item.cold = !!k.cold?.includes(band);
    }
    const word = this._words(k.words)[band];
    return {
      ...item,
      unit,
      band,
      value: this._format(st, kind),
      word,
      state: word ? `${this._format(st, kind)} · ${word}` : this._format(st, kind),
      icon: e.icon ?? k.icons?.[band] ?? k.icon,
      pct: Math.round(Math.min(1, Math.max(0, (value - gauge[0]) / (gauge[1] - gauge[0]))) * 100),
    };
  }

  _collect() {
    const areaName = this._areaName();
    const entries = this._entries();
    const seen = new Set();
    const dupes = new Set();
    for (const e of entries) {
      const kind = reKindOf(this._hass.states[e.entity]);
      if (seen.has(kind)) dupes.add(kind);
      seen.add(kind);
    }
    const order = (i) => RE_ORDER.indexOf(i.kind);
    return entries.map((e) => this._item(e, areaName, dupes)).sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
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

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok" || i.unavailable) : items;
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
    .tile.na { --t: var(--rc-na); }
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
  helpers: ["title", "navigation_path", "only_alerts", "show_gauge", "include"],
  schema: (_lang, hass, config) => [
    ...rcAreaFields(true),
    ...rcBooleans("only_alerts", "show_gauge"),
    ...rcIncludeField(RoomEnvironmentCard, hass, config),
    ...rcExcludeField(RoomEnvironmentCard, hass, config),
  ],
});

rcRegister(
  RoomEnvironmentCard,
  RoomEnvironmentCardEditor,
  "Room Environment Card",
  "Temperature, humidity, air quality, noise and light level of a room, coloured by comfort",
);

// ── Mini card ────────────────────────────────────────────────────────────────
// The same readings on a single line: the room badge and title, then one chip per reading (icon and value),
// tinted only when the reading needs a look. Wraps onto a second line when the card is narrow.
class RoomEnvironmentMiniCard extends RoomEnvironmentCard {
  static tag = "room-environment-mini-card";
  static defaults = { only_alerts: false, exclude: [] };

  getCardSize() {
    return this.style.display === "none" ? 0 : 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 4, rows: "auto" };
  }

  // Number in full, unit small and muted ("°" for a temperature) to keep the chips short.
  _chipValue(i) {
    if (i.value == null) return "<span>—</span>";
    const unit = i.unit || "";
    const num = unit && i.value.endsWith(unit) ? i.value.slice(0, -unit.length).trim() : i.value;
    const short = /^°[CF]$/.test(unit) ? "°" : unit;
    return `<span>${rcEsc(num)}</span>${short && num !== i.value ? `<small>${rcEsc(short)}</small>` : ""}`;
  }

  _draw(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold || worst.sev === "info" ? "cold" : worst.sev) : "ok";
    if (!this._changed(["mini", items.map((i) => [i.id, i.icon, i.state, i.sev, i.cold])])) return;

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok" || i.unavailable) : items;
    this._shown = shown.length;
    const status = this._status(items, worst);
    const chips = shown
      .map(
        (i) => `
        <button class="r ${i.unavailable ? "na" : `s-${i.sev}`}${i.cold ? " cold" : ""}${i.light ? " lit" : ""} k-${i.kind}"
                data-id="${rcEsc(i.id)}" title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
          <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${this._chipValue(i)}
        </button>`,
      )
      .join("");
    const nav = c.navigation_path;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${RoomEnvironmentCard.styles}${RoomEnvironmentMiniCard.miniStyles}</style>
      <ha-card class="lvl-${level}">
        <div class="mini">
          <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${this._headIcon(worst)}"></ha-icon></div>
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
    if (nav) {
      const head = root.querySelector(".head");
      head.addEventListener("click", () => rcNavigate(nav));
      head.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && ev.target === head) rcNavigate(nav);
      });
    }
    for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
  }

  static miniStyles = `
    ha-card { padding: 8px 10px; }
    .mini { display: flex; align-items: center; gap: 10px; }
    .mini .badge { width: 32px; height: 32px; }
    .mini .badge ha-icon { --mdc-icon-size: 18px; }
    .body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .mini .head { gap: 8px; }
    .mini .title { flex: 0 1 auto; font-size: 14px; line-height: 18px; }
    .st { flex: none; margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
    /* Comfortable readings are plain text; only the ones needing a look get a tinted pill. */
    .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
    .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
         border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 18px; white-space: nowrap; --t: var(--rc-ok);
         color: var(--primary-text-color); }
    .r ha-icon { --mdc-icon-size: 13px; color: var(--t); align-self: center; margin-right: 2px; }
    .r small { font-size: 10px; font-weight: 400; opacity: .7; margin-left: 1px; }
    .r.s-warn  { --t: var(--rc-warn); }
    .r.s-alert { --t: var(--rc-alert); }
    .r.cold    { --t: var(--rc-info); }
    .r.k-illuminance     { --t: var(--rc-idle); }
    .r.k-illuminance.lit { --t: var(--rc-light); }
    .r.na { --t: var(--rc-na); opacity: .7; }
    .r.s-warn, .r.s-alert, .r.cold.s-info, .r.cold.s-warn {
      color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); }
    .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
    .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  `;
}

const RoomEnvironmentMiniCardEditor = rcEditor({
  card: RoomEnvironmentMiniCard,
  helpers: ["title", "navigation_path", "only_alerts", "include"],
  schema: (_lang, hass, config) => [
    ...rcAreaFields(true).filter((f) => f.name !== "columns"),
    ...rcBooleans("only_alerts"),
    ...rcIncludeField(RoomEnvironmentMiniCard, hass, config),
    ...rcExcludeField(RoomEnvironmentMiniCard, hass, config),
  ],
});

rcRegister(
  RoomEnvironmentMiniCard,
  RoomEnvironmentMiniCardEditor,
  "Room Environment Mini Card",
  "The environment readings of a room on a single line: one chip per reading, tinted when it needs a look",
);

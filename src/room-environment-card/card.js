// ── Card ─────────────────────────────────────────────────────────────────────
// Background colour of a tile by its reading (`color_thresholds`): a list of steps `{ below, color }` read in order,
// the first whose `below` is above the value wins, a last step without `below` takes the rest. Per kind
// (`{ temperature: [...], humidity: [...] }`) or a bare list for the temperature; values in the sensor's unit.
// With `layout: tiles` and no `color_thresholds`, the temperature is coloured by default (in °C, a °F sensor
// converted): dark blue under 16, light blue under 19, green under 23, yellow under 26, red above.
// `color_thresholds: false` turns the colours off.
import { RE_KINDS, RE_ORDER, RE_RANK, RE_SEV, reKindOf, reMatch, reValid } from "./sensor-kinds.js";
import { reBand, reConvert, reCustom, reIsAppliance, reOutdoorInfo, reScale } from "./appliance-sensors.js";
import { RE_I18N } from "./i18n/re-i18n.js";

export const RE_TINT_DEFAULT = [
  { below: 16, color: "#1565c0" },
  { below: 19, color: "#4fc3f7" },
  { below: 23, color: "#43a047" },
  { below: 26, color: "#fbc02d" },
  { color: "#e53935" },
];
export const reTint = (kind, value, unit, cfg, tiles) => {
  if (cfg === false || !Number.isFinite(value)) return null;
  const custom = Array.isArray(cfg) ? (kind === "temperature" ? cfg : null) : cfg?.[kind];
  let steps = Array.isArray(custom) ? custom : null;
  let v = value;
  if (!steps && kind === "temperature" && tiles && !Array.isArray(cfg)) {
    steps = RE_TINT_DEFAULT;
    v = reConvert(kind, value, unit, "°C");
  }
  if (!steps) return null;
  const step = steps.find((s) => s && (s.below == null || v < Number(s.below)));
  return typeof step?.color === "string" && step.color ? step.color : null;
};

// The last 24 hours behind a tile: area and line of the 5-minute means, scaled to their own range.
export const RE_HIST_WINDOW = 24 * 3600000;
export function reSpark(points, end) {
  if (!points || points.length < 2) return "";
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = hi - lo || 1;
  const x = (t) => Math.max(0, Math.min(100, (100 * (t - (end - RE_HIST_WINDOW))) / RE_HIST_WINDOW)).toFixed(2);
  const y = (v) => (28 - ((v - lo) / span) * 24).toFixed(2);
  const line = `M${points.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}`;
  const area = `M${x(points[0].t)},30L${points.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}L${x(points.at(-1).t)},30Z`;
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="${area}"/><path class="spark-l" d="${line}"/></svg>`;
}

// Lowest and highest of the curve's points, or null without a curve.
export function reRange(points) {
  if (!points || points.length < 2) return null;
  const vs = points.map((p) => p.v);
  return { lo: Math.min(...vs), hi: Math.max(...vs) };
}

export class RoomEnvironmentCard extends RcCard {
  static tag = "room-environment-card";
  static i18n = RE_I18N;
  static needsArea = true;
  static includeDomains = ["sensor"];
  static sceneTheme = "environment";
  static includeMatch = (hass, id) => !!reKindOf(hass.states[id]);
  static defaults = { columns: 2, layout: "compact", only_alerts: false, show_gauge: true, show_history: true, exclude: [] };

  _candidate(id) {
    return reMatch(this._hass, id) && this._ambientSensor(id);
  }

  // Device id → its entity ids, rebuilt only when the entity registry changes. Used to spot an appliance by its
  // companion entities (a sensor of a device that is also a climate/water_heater/number… is not a room reading).
  _deviceEntities() {
    const h = this._hass;
    return rcMemo((this._memo ||= {}), "devEnts", [h.entities], () => {
      const map = {};
      for (const [eid, ent] of Object.entries(h.entities || {})) if (ent?.device_id) (map[ent.device_id] ||= []).push(eid);
      return map;
    });
  }

  // Keep a sensor only if it reads the room's air, not an appliance's inside (issue #89). `appliance_filter: false`
  // turns the heuristic off; an explicit `entities` list already bypasses discovery and so always wins.
  _ambientSensor(id) {
    if (this._config.appliance_filter === false) return true;
    return !reIsAppliance(this._hass, id, this._deviceEntities());
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
    // HA's full locale (pt-BR, de-CH) when it is the card's language, else the card's resolved language. HA's `pt`
    // is European Portuguese, which Intl reads as Brazilian: it becomes `pt-PT`.
    const lang = this._lang();
    const ha = this._hass?.locale?.language || this._hass?.language;
    const full = !lang.includes("-") && ha?.split("-")[0] === lang ? ha : lang;
    const locale = full === "pt" ? "pt-PT" : full;
    const n = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    return unit ? `${n} ${unit}` : n;
  }

  // One reading per kind: the mean of the sensors of that kind that report a number, unavailable and unknown ones
  // ignored (a kind with none left is not shown). A single sensor keeps Home Assistant's formatting and its
  // `name` / `icon` overrides; a mean is formatted with the kind's precision.
  _reading(kind, members, room) {
    const k = RE_KINDS[kind];
    const [first] = members;
    const single = members.length === 1;
    const unit = first.st.attributes.unit_of_measurement;
    const values = members.map((m) => reConvert(kind, Number.parseFloat(m.st.state), m.st.attributes.unit_of_measurement, unit));
    const value = values.reduce((t, v) => t + v, 0) / values.length;
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
    const entries = this._entries();
    // Sensors of a known kind that report no number (unavailable, unknown): no reading, but a muted *N unavailable*.
    this._na = entries
      .map((e) => e.entity)
      .filter((id) => {
        const st = this._hass.states[id];
        return reKindOf(st) && !reValid(st);
      });
    // `layout: tiles`: one tile per sensor, as with the Tile card, rather than one mean per kind.
    return this._itemsOf(entries, { name: this._areaName(), thresholds: this._config.thresholds }, this._tiles());
  }

  // The readings of `entries`, one per kind, in kind order; also used by the overview, room by room.
  // `room`: { name, thresholds } of the room, for its comfort limits.
  _itemsOf(entries, room, split = false) {
    const byKind = {};
    for (const e of entries) {
      const st = this._hass.states[e.entity];
      const kind = reKindOf(st);
      if (kind && reValid(st)) (byKind[kind] ||= []).push({ e, st });
    }
    // A mean only makes sense in one unit: temperatures are converted to the first sensor's unit (°C / °F), other
    // kinds are split by unit (VOC in µg/m³ and in ppb cannot be converted), one reading per unit.
    return RE_ORDER.filter((kind) => byKind[kind]).flatMap((kind) => {
      const byUnit = new Map();
      for (const m of byKind[kind]) {
        const unit = kind === "temperature" ? "" : (m.st.attributes.unit_of_measurement ?? "");
        if (!byUnit.has(unit)) byUnit.set(unit, []);
        byUnit.get(unit).push(m);
      }
      return [...byUnit.values()].flatMap((members) =>
        split ? members.map((m) => this._sensorReading(kind, m, room)) : [this._reading(kind, members, room)],
      );
    });
  }

  // One sensor's own reading (`layout: tiles`): named after the sensor, the room's name left out.
  _sensorReading(kind, m, room) {
    const item = this._reading(kind, [m], room);
    if (m.e.name) return item;
    const name = rcCleanName(m.st.attributes.friendly_name, room.name, /^$/, /^$/);
    return { ...item, name: name || item.name };
  }

  // Number in full, unit small and muted ("°" for a temperature) to keep the chips short.
  _chipValue(i) {
    if (i.value == null) return "<span>—</span>";
    const unit = i.unit || "";
    const num = unit && i.value.endsWith(unit) ? i.value.slice(0, -unit.length).trim() : i.value;
    const short = /^°[CF]$/.test(unit) ? "°" : unit;
    return `<span>${rcEsc(num)}</span>${short && num !== i.value ? `<small>${rcEsc(short)}</small>` : ""}`;
  }

  // A reading's number without its unit, for the banner's wall sensor ("21.4").
  _bare(i) {
    const unit = i.unit || "";
    return unit && i.value.endsWith(unit) ? i.value.slice(0, -unit.length).trim() : i.value;
  }

  // The banner: the wall sensor shows the reading that needs a look in its comfort colour (else temperature and
  // humidity in green), with snow at the window when cold, mist when humid, a strong sun when hot, a haze when the air
  // is stale.
  _sceneState() {
    return this._envScene(this._items || []);
  }

  _envScene(items) {
    const worst = this._worst(items);
    const temp = items.find((i) => i.kind === "temperature" && i.value != null);
    const hum = items.find((i) => i.kind === "humidity" && i.value != null);
    const bad = !!worst && RE_RANK[worst.sev] >= RE_RANK.warn;
    const family = worst && RE_KINDS[worst.kind]?.issue;
    const high = bad && worst.band > 2;
    const tone = !worst ? "ok" : worst.cold || worst.sev === "info" ? "cold" : worst.sev;
    const fx = worst?.cold ? "cold" : high && family === "temperature" ? "hot" : high && family === "humidity" ? "humid" : bad && (family === "co2" || family === "air") ? "air" : "";
    if (fx === "air" && worst.value != null) return { tone, fx, top: this._bare(worst), bottom: worst.unit || "" };
    const t = temp && `${this._bare(temp)}°`;
    const h = hum && `${this._bare(hum)}%`;
    return { tone, fx, top: t || h || "—", bottom: t && h ? h : "" };
  }

  // The reading that needs a look first: the highest severity, then the kind order.
  _worst(items) {
    return items.reduce((w, i) => (RE_RANK[i.sev] > RE_RANK[w?.sev ?? "ok"] ? i : w), null);
  }

  _status(items, worst) {
    if (!items.length) return this._na?.length ? this._tn("unavail", this._na.length) : this._t("no_sensors");
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

  // 24 h of 5-minute means of the readings (their first sensor), from the recorder's statistics: one query, again
  // every 5 minutes; drawn behind the tiles once it has come.
  _history(ids) {
    const key = ids.join(",");
    if (!key || !this._hass.callWS || this._config.show_history === false) return null;
    if (this._histKey !== key || Date.now() - (this._histAt || 0) > 300000) {
      const end = Date.now();
      this._histKey = key;
      this._histAt = end;
      this._hass
        .callWS({ type: "recorder/statistics_during_period", start_time: new Date(end - RE_HIST_WINDOW).toISOString(), statistic_ids: ids, period: "5minute", types: ["mean"] })
        .then((r) => {
          if (this._histKey !== key) return;
          this._hist = { end, points: Object.fromEntries(ids.map((id) => [id, (r?.[id] || []).map((p) => ({ t: typeof p.start === "number" ? p.start : Date.parse(p.start), v: p.mean })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))])) };
          this._histVer = (this._histVer || 0) + 1;
          if (this._lastItems) this._draw(this._lastItems);
        })
        .catch(() => {
          this._histAt = Date.now() - 240000;
        });
    }
    return this._histKey === key ? this._hist : null;
  }

  _rangeTitle(i, hist) {
    const r = hist && reRange(hist.points[i.id]);
    if (!r) return `${i.name} — ${i.state}`;
    const digits = RE_KINDS[i.kind]?.digits ?? 1;
    return `${i.name} — ${i.state} · 24 h ${this._formatNumber(r.lo, digits, i.unit)} – ${this._formatNumber(r.hi, digits, i.unit)}`;
  }

  _draw(items) {
    const c = this._config;
    const worst = this._worst(items);
    const level = worst ? (worst.cold ? "cold" : worst.sev) : "ok";
    this._lastItems = items;
    const hist = this._history(items.filter((i) => !i.unavailable && i.id).map((i) => i.id));

    const na = this._naItem();
    if (!this._changed([items.map((i) => [i.id, i.name, i.icon, i.state, i.sev, i.cold, i.pct]), na?.name, na?.state, this._histVer]))
      return;
    const tint = (i) => reTint(i.kind, i.num, i.unit, c.color_thresholds, this._tiles());

    const shown = c.only_alerts ? items.filter((i) => i.sev !== "ok") : items;
    this._shown = shown.length + (na ? 1 : 0);
    const tiles = shown
      .map((i) =>
        this._tile(i, {
          cls: ` k-${i.kind} s-${i.sev}${i.cold ? " cold" : ""}${i.light ? " lit" : ""}${tint(i) ? " tint" : ""}`,
          style: tint(i) ? `--t: ${tint(i)}` : "",
          extra:
            (hist ? reSpark(hist.points[i.id], hist.end) : "") +
            (c.show_gauge && i.pct != null ? `<span class="gauge"><span style="width:${i.pct}%"></span></span>` : ""),
          // The comfort word only when the reading needs a look (and for the light level): shorter tiles.
          // The curve has no scale: its lowest and highest values of the 24 hours in the tooltip.
          title: this._rangeTitle(i, hist),
          state: i.word && (i.sev !== "ok" || i.kind === "illuminance")
            ? `<span class="val">${rcEsc(i.value)}</span> · ${rcEsc(i.word)}`
            : `<span class="val">${rcEsc(i.value ?? i.state)}</span>`,
        }),
      )
      .join("");
    const naTile = na ? this._tile(na, { cls: " k-na", state: rcEsc(na.state) }) : "";
    const head = this._head({
      icon: this._headIcon(worst),
      title: c.title || this._areaName() || this._t("title"),
      status: this._status(items, worst),
    });
    this._paint(level === "info" ? "cold" : level, head, tiles + naTile);
  }

  // The unavailable sensors as one muted tile or chip (*2 unavailable*, their names below): a tap opens the first one.
  _naItem() {
    const na = this._na ?? [];
    if (!na.length) return null;
    return {
      id: na[0],
      unavailable: true,
      name: this._tn("unavail", na.length),
      icon: "mdi:alert-circle-outline",
      state: na.map((id) => this._hass.states[id]?.attributes.friendly_name || id).join(", "),
    };
  }

  // A tap opens the details (history graph): a reading cannot be toggled.
  _bindTile(el) {
    el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id), this._on);
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
    /* The unavailable sensors' names on one line: the tooltip lists them all. */
    .tile.k-na .state { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Only what needs a look is tinted: comfortable readings and the light level stay neutral. */
    .tile.s-ok { background: var(--secondary-background-color, transparent); border-color: transparent; }
    .val { color: var(--primary-text-color); font-weight: 600; }
    .tile.s-warn .state, .tile.s-alert .state, .tile.cold .state { color: var(--t); }
    .tile.s-warn .val, .tile.s-alert .val, .tile.cold .val { color: inherit; }
    /* The last 24 hours behind the reading, in its level's colour, discreet. */
    /* The lower half of the tile: under the value and gauge, clear of the name and icon. */
    .spark { position: absolute; left: 0; right: 0; bottom: 0; width: 100%; height: 50%; pointer-events: none; border-bottom-left-radius: inherit; border-bottom-right-radius: inherit; }
    .spark-a { fill: color-mix(in srgb, var(--t) 8%, transparent); }
    .spark-l { fill: none; stroke: color-mix(in srgb, var(--t) 35%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
    .tile > :not(.spark):not(.gauge) { position: relative; }
    /* Drawn in the bottom padding of the tile: no extra height. */
    .gauge { position: absolute; inset: auto 8px 2px 41px; height: 2px; border-radius: 1px; pointer-events: none;
             background: color-mix(in srgb, var(--t) 16%, transparent); }
    /* color_thresholds: the whole tile in the reading's colour, its value in full contrast. */
    .tile.tint, .tile.tint.s-ok { background: color-mix(in srgb, var(--t) 22%, var(--card-background-color, transparent));
                                  border-color: color-mix(in srgb, var(--t) 45%, transparent); }
    .tile.tint .ic { color: var(--t); background: color-mix(in srgb, var(--t) 28%, transparent); }
    .tile.tint .state, .tile.tint .val { color: var(--primary-text-color); }
    .layout-tiles .gauge { left: 58px; bottom: 3px; }
    .gauge > span { display: block; height: 100%; border-radius: inherit; background: var(--t); transition: width .4s; }
    @media (prefers-reduced-motion: reduce) { .gauge > span { transition: none; } }
    /* Very narrow card (a phone, 6 columns: one tile per row of ~130 px): the reading wins the room of the tile's icon. */
    @container (max-width: 200px) {
      .tile { padding-left: 8px; }
      .tile .ic { display: none; }
      .gauge, .layout-tiles .gauge { left: 8px; }
    }
  `;
}

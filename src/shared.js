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

// Devices with a camera entity: their motion and person detections are left out.
const rcCameraDevices = (hass) =>
  new Set(
    Object.entries(hass.entities || {})
      .filter(([id, r]) => id.startsWith("camera.") && r.device_id)
      .map(([, r]) => r.device_id),
  );

// Power sensor (device class power, W or kW) of each device.
const rcPowerSensors = (hass) => {
  const out = {};
  for (const [id, r] of Object.entries(hass.entities || {})) {
    if (r.device_id && !out[r.device_id] && id.startsWith("sensor.") && hass.states[id]?.attributes.device_class === "power") {
      out[r.device_id] = id;
    }
  }
  return out;
};

const rcWattsOf = (hass, sensorId) => {
  const st = sensorId && hass.states[sensorId];
  const v = st ? Number.parseFloat(st.state) : Number.NaN;
  if (!Number.isFinite(v)) return null;
  return st.attributes.unit_of_measurement === "kW" ? v * 1000 : v;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  const l = (config?.language || hass?.locale?.language || hass?.language || "en").slice(0, 2);
  return i18n[l] ? l : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? i18n.en[key] ?? key;
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

const rcUnavailable = (st) => ["unavailable", "unknown"].includes(st.state);

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
    if (!this._dragging) this._render();
  }

  getCardSize() {
    return 1 + Math.ceil((this._items?.length || 1) / (this._config?.columns || 2));
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
    const exclude = new Set(c.exclude || []);
    this._prepare();
    const found = c.area
      ? Object.keys(h.states)
          .filter((id) => !exclude.has(id) && !h.entities?.[id]?.hidden && this._areaOf(id) === c.area && this._candidate(id))
          .map((entity) => ({ entity }))
      : [];
    const ids = new Set(found.map((e) => e.entity));
    return [...found, ...list(c.include).filter((e) => !ids.has(e.entity))];
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

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  _head({ icon, title, status, chips = "", allOff = false }) {
    const c = this._config;
    return `
      <div class="head${c.navigation_path ? " nav" : ""}">
        <div class="badge"><ha-icon icon="${icon}"></ha-icon></div>
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
              ${style ? `style="${style}"` : ""} title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
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
      if (ids.length) this._hass.callService("homeassistant", "turn_off", { entity_id: ids });
    });
    if (this._config.navigation_path) {
      root.querySelector(".head").addEventListener("click", () => rcNavigate(this._config.navigation_path));
    }
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
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (mode) return;
        mode = "hold";
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
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      if (mode === "drag") {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
    };
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        onTap();
      }
    });
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && this._hass.callService("homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Editor ───────────────────────────────────────────────────────────────────
// Fields shared by the room cards' editors.
const rcAreaFields = (navigation) => [
  { name: "area", selector: { area: {} } },
  { name: "title", selector: { text: {} } },
  ...(navigation ? [{ name: "navigation_path", selector: { navigation: {} } }] : []),
  { name: "columns", selector: { number: { min: 1, max: 4, mode: "box" } } },
];
const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

// Include list: the entities of the card's domains, anywhere in the home, that the card does not show yet
// (entities already included stay in the list).
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
      !shown.has(id) &&
      !hass.entities?.[id]?.hidden &&
      !hass.entities?.[id]?.entity_category,
  );
  for (const e of config?.include || []) {
    const id = typeof e === "string" ? e : e.entity;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids.length ? [{ name: "include", selector: { entity: { multiple: true, include_entities: ids } } }] : [];
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
  return ids.length ? [{ name: "exclude", selector: { entity: { multiple: true, include_entities: ids } } }] : [];
};

// `schema(lang, hass, config)` lists the fields; options left at their default are not written to the YAML.
const rcEditor = ({ i18n, defaults, helpers, schema }) =>
  class extends HTMLElement {
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
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, lang, `ed_${s.name}`);
        this._form.computeHelper = (s) => (helpers.includes(s.name) ? rcT(i18n, lang, `ed_${s.name}_helper`) : undefined);
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
      this._form.data = { ...defaults, ...this._config };
      this._form.schema = schema(lang, this._hass, this._config);
    }
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
  .badge { flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 20px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  .title { flex: 1; min-width: 0; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pill { all: unset; flex: none; display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 10px; }
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

// ── Control sections ─────────────────────────────────────────────────────────
// The sections that have no room card of their own (#114): climate, covers, media players, appliances and custom
// entities. Each is one embedded element with the room card's foldable header and one row per entity, its controls on
// the row: the set temperature with − / +, open / stop / close, play / pause, a toggle. A tap on a row's name opens the
// entity's details. They feed the room's indicators too (heating, covers open, playing, an appliance running).
import { RM_I18N } from "./i18n/rm-i18n.js";

// Cover features (CoverEntityFeature) and media player features (MediaPlayerEntityFeature) the rows use.
const RM_COVER_OPEN = 1;
const RM_COVER_CLOSE = 2;
const RM_COVER_STOP = 8;
const RM_MEDIA_PAUSE = 1;
const RM_MEDIA_TURN_ON = 128;
const RM_MEDIA_PLAY = 16384;

// An appliance: a machine state / programme sensor of a washing machine, dishwasher, dryer or oven (Home Connect,
// SmartThings, LG ThinQ, Miele and others name them so), or a sensor of a device with such a word in its name.
export const RM_APPLIANCE_ID = /(operation_state|run_state|machine_state|job_state|program_progress|programme_progress|washer_state|dryer_state|dishwasher_state|oven_state|current_course|cycle_status)$/;
export const RM_APPLIANCE_DEVICE = /(wash|dish|dryer|lave|vaisselle|s[eè]che|oven|\bfour\b|geschirr|wasch|trockner|lavadora|lavavajillas|lavatrice|lavastoviglie)/i;
// States of an appliance that is not running.
export const RM_APPLIANCE_IDLE = /^(off|idle|ready|inactive|standby|stop|stopped|finished|end|done|none|power_off|unavailable|unknown|initial|waiting|pause|paused)$/i;
// Domains of the custom section that toggle, and those that are pressed.
const RM_TOGGLE = new Set(["switch", "light", "fan", "input_boolean", "automation", "siren", "humidifier"]);
const RM_PRESS = { button: ["button", "press"], input_button: ["input_button", "press"], scene: ["scene", "turn_on"], script: ["script", "turn_on"] };

export const RM_CONTROL_KINDS = {
  climate: { icon: "mdi:thermostat", domains: ["climate"] },
  covers: { icon: "mdi:window-shutter", domains: ["cover"] },
  media: { icon: "mdi:television-play", domains: ["media_player"] },
  appliances: { icon: "mdi:washing-machine", domains: ["sensor", "select"] },
  custom: { icon: "mdi:tune-variant", domains: [] },
};

// A climate entity's heating or cooling, from its hvac_action (or its mode when it reports none).
export const rmClimateAction = (st) => {
  const a = st.attributes?.hvac_action;
  if (a === "heating" || a === "preheating") return "heat";
  if (a === "cooling") return "cool";
  if (a === "drying" || a === "fan") return "fan";
  if (a) return a === "off" ? "off" : "idle";
  return st.state === "off" ? "off" : st.state === "heat" ? "heat" : st.state === "cool" ? "cool" : "idle";
};

const rmNum = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

export class RoomControlsSection extends RcCard {
  static tag = "room-controls-section";
  static i18n = RM_I18N;
  // Nothing to show without an area, nor entities (custom) or include: left out by the room card.
  static needsArea = true;
  static defaults = { exclude: [] };
  static styles = `
    .rows { display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 4px 8px 4px 6px; border-radius: 10px;
           background: var(--rc-tile-bg, color-mix(in srgb, var(--primary-text-color) 5%, transparent)); --k: var(--rc-idle); }
    .row.heat { --k: var(--rc-warn); } .row.cool { --k: var(--rc-info); } .row.on { --k: var(--rc-ok); }
    .row.open { --k: var(--rc-info); } .row.play { --k: var(--rc-media, #9c6ade); } .row.run { --k: var(--rc-ok); }
    .row.na { opacity: .6; }
    .row .ic { flex: none; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: var(--k);
               background: color-mix(in srgb, var(--k) 14%, transparent); }
    .row .ic ha-icon { --mdc-icon-size: 18px; }
    .row .info { all: unset; cursor: pointer; flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .row .info:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 6px; }
    .row .name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row .state { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .row .ctl { flex: none; display: flex; align-items: center; gap: 4px; }
    .row .val { min-width: 42px; text-align: center; font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .cb { all: unset; cursor: pointer; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
          border: 1px solid var(--divider-color, rgba(127,127,127,.3)); color: var(--primary-text-color); }
    .cb ha-icon { --mdc-icon-size: 18px; }
    .cb:hover { background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
    .cb:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
    .cb.on { color: var(--k); border-color: color-mix(in srgb, var(--k) 50%, transparent); background: color-mix(in srgb, var(--k) 14%, transparent); }
  `;

  _candidate(id) {
    const c = this._config;
    const h = this._hass;
    const domain = id.split(".")[0];
    if (c.kind === "custom") return false;
    if (!RM_CONTROL_KINDS[c.kind]?.domains.includes(domain)) return false;
    if (c.kind !== "appliances") return true;
    // Appliances: the machine state sensor of a washer, dishwasher, dryer or oven, one per device.
    if (RM_APPLIANCE_ID.test(id)) return true;
    const e = h.entities?.[id];
    const dev = e?.device_id && h.devices?.[e.device_id];
    const devName = `${dev?.name_by_user || dev?.name || ""} ${dev?.model || ""}`;
    return domain === "sensor" && RM_APPLIANCE_DEVICE.test(devName) && /(state|status|program|programme)$/.test(id);
  }

  // The custom section shows the `entities` the room card hands it; the others what the area holds.
  _entries() {
    const list = super._entries();
    if (this._config.kind !== "appliances") return list;
    // One machine state per device.
    const seen = new Set();
    return list.filter((e) => {
      const dev = this._hass.entities?.[e.entity]?.device_id || e.entity;
      if (seen.has(dev)) return false;
      seen.add(dev);
      return true;
    });
  }

  _collect() {
    const h = this._hass;
    const room = this._areaName();
    return this._entries().map((e) => {
      const domain = e.entity.split(".")[0];
      const st = h.states[e.entity];
      const unavailable = rcUnavailable(st);
      const name = e.name ?? rcCleanName(st.attributes.friendly_name || e.entity, room, "", "");
      const icon = e.icon ?? h.entities?.[e.entity]?.icon ?? st.attributes.icon;
      const item = { id: e.entity, domain, name, unavailable, st };
      if (domain === "climate") {
        const action = rmClimateAction(st);
        Object.assign(item, {
          kind: "climate",
          cls: action === "heat" ? "heat" : action === "cool" ? "cool" : action === "fan" ? "on" : "",
          icon: icon || (action === "cool" ? "mdi:snowflake" : action === "heat" ? "mdi:fire" : "mdi:thermostat"),
          on: action === "heat" || action === "cool",
          action,
          current: rmNum(st.attributes.current_temperature),
          target: rmNum(st.attributes.temperature),
        });
      } else if (domain === "cover") {
        const pos = rmNum(st.attributes.current_position);
        const open = st.state === "open" || st.state === "opening" || (pos != null && pos > 0 && st.state !== "closed");
        Object.assign(item, { kind: "cover", cls: open ? "open" : "", icon: icon || (open ? "mdi:window-shutter-open" : "mdi:window-shutter"), on: open, pos });
      } else if (domain === "media_player") {
        const playing = st.state === "playing";
        Object.assign(item, {
          kind: "media",
          cls: playing ? "play" : st.state === "off" || st.state === "standby" ? "" : "on",
          icon: icon || (playing ? "mdi:play-circle" : "mdi:television"),
          on: playing,
          title: [st.attributes.media_title, st.attributes.media_artist].filter(Boolean).join(" · ") || st.attributes.app_name || st.attributes.source || "",
        });
      } else if (this._config.kind === "appliances") {
        const running = !unavailable && !RM_APPLIANCE_IDLE.test(String(st.state));
        Object.assign(item, { kind: "appliance", cls: running ? "run" : "", icon: icon || "mdi:washing-machine", on: running, remaining: this._remaining(e.entity) });
      } else {
        const on = st.state === "on" || st.state === "open" || st.state === "playing";
        Object.assign(item, { kind: RM_TOGGLE.has(domain) ? "toggle" : RM_PRESS[domain] ? "press" : "value", cls: on ? "on" : "", icon: icon || "mdi:checkbox-blank-circle-outline", on });
      }
      if (unavailable) item.cls = "na";
      item.state = this._stateText(item);
      return item;
    });
  }

  // The remaining time of an appliance: a duration or end-time sensor of the same device.
  _remaining(id) {
    const h = this._hass;
    const dev = h.entities?.[id]?.device_id;
    if (!dev) return null;
    for (const [eid, e] of Object.entries(h.entities || {})) {
      if (e.device_id !== dev || !eid.startsWith("sensor.") || !/(remaining|finish|end_time|completion|time_left|restzeit)/.test(eid)) continue;
      const st = h.states[eid];
      if (!st || rcUnavailable(st)) continue;
      if (st.attributes.device_class === "timestamp") {
        const left = Math.round((Date.parse(st.state) - Date.now()) / 60000);
        if (Number.isFinite(left) && left > 0) return left;
      } else {
        const v = rmNum(st.state);
        const unit = st.attributes.unit_of_measurement;
        if (v != null && v > 0) return Math.round(unit === "s" ? v / 60 : unit === "h" ? v * 60 : v);
      }
    }
    return null;
  }

  _fmtTemp(v) {
    return v == null ? "—" : `${new Intl.NumberFormat(this._lang(), { maximumFractionDigits: 1 }).format(v)}°`;
  }

  _stateText(i) {
    const fmt = (s) => this._hass.formatEntityState?.(i.st) ?? s;
    if (i.unavailable) return this._t("unavailable");
    switch (i.kind) {
      case "climate": {
        const what = i.action === "heat" ? this._t("ctl_heating") : i.action === "cool" ? this._t("ctl_cooling") : i.action === "off" ? fmt(i.st.state) : this._t("ctl_idle");
        return i.current != null ? `${what} · ${this._fmtTemp(i.current)}` : what;
      }
      case "cover":
        return i.pos != null && i.on ? `${fmt(i.st.state)} · ${i.pos} %` : fmt(i.st.state);
      case "media":
        return i.title ? `${fmt(i.st.state)} · ${i.title}` : fmt(i.st.state);
      case "appliance":
        return i.on && i.remaining ? `${fmt(i.st.state)} · ${this._t("ctl_minutes", { n: i.remaining })}` : fmt(i.st.state);
      default:
        return fmt(i.st.state);
    }
  }

  // The header: how many are heating / open / playing / running / on, else quiet.
  _status(items) {
    const on = items.filter((i) => i.on).length;
    const kind = this._config.kind;
    if (!on) return this._t(kind === "covers" ? "ctl_all_closed" : "ctl_idle");
    return this._tn(`ctl_on_${kind}`, on);
  }

  _btn(act, icon, label, on = false) {
    return `<button class="cb${on ? " on" : ""}" data-act="${act}" title="${rcEsc(label)}" aria-label="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon></button>`;
  }

  // The controls of a row.
  _controls(i) {
    if (i.unavailable) return "";
    const f = Number(i.st.attributes.supported_features) || 0;
    switch (i.kind) {
      case "climate": {
        if (i.st.state === "off" || i.target == null) return "";
        const target = this._pend?.[i.id] ?? i.target;
        return `${this._btn("down", "mdi:minus", this._t("ctl_lower"))}<span class="val">${this._fmtTemp(target)}</span>${this._btn("up", "mdi:plus", this._t("ctl_raise"))}`;
      }
      case "cover":
        return [
          f & RM_COVER_OPEN ? this._btn("open", "mdi:arrow-up", this._t("ctl_open")) : "",
          f & RM_COVER_STOP ? this._btn("stop", "mdi:stop", this._t("ctl_stop")) : "",
          f & RM_COVER_CLOSE ? this._btn("close", "mdi:arrow-down", this._t("ctl_close")) : "",
        ].join("");
      case "media":
        if (i.st.state === "off" || i.st.state === "standby") return f & RM_MEDIA_TURN_ON ? this._btn("power", "mdi:power", this._t("ctl_turn_on")) : "";
        return f & (RM_MEDIA_PAUSE | RM_MEDIA_PLAY)
          ? this._btn("playpause", i.on ? "mdi:pause" : "mdi:play", this._t(i.on ? "ctl_pause" : "ctl_play"), i.on)
          : "";
      case "toggle":
        return this._btn("toggle", "mdi:power", this._t(i.on ? "ctl_turn_off" : "ctl_turn_on"), i.on);
      case "press":
        return this._btn("press", "mdi:gesture-tap", this._t("ctl_press"));
      default:
        return "";
    }
  }

  _row(i) {
    return `<div class="row ${i.cls}" data-id="${rcEsc(i.id)}">
        <span class="ic"><ha-icon icon="${rcEsc(i.icon)}"></ha-icon></span>
        <button class="info" title="${rcEsc(`${i.name} — ${i.state}`)}"><span class="name">${rcEsc(i.name)}</span><span class="state">${rcEsc(i.state)}</span></button>
        <span class="ctl">${this._controls(i)}</span>
      </div>`;
  }

  _afterGrid() {
    const items = this._items || [];
    return items.length ? `<div class="rows">${items.map((i) => this._row(i)).join("")}</div>` : "";
  }

  _bindAfter(root) {
    const on = this._on;
    for (const row of root.querySelectorAll(".row")) {
      const item = (this._items || []).find((i) => i.id === row.dataset.id);
      if (!item) continue;
      row.querySelector(".info")?.addEventListener("click", () => rcMoreInfo(this, item.id), on);
      for (const b of row.querySelectorAll(".cb")) b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._act(item, b.dataset.act);
      }, on);
    }
  }

  _act(i, act) {
    const h = this._hass;
    const id = { entity_id: i.id };
    if (act === "up" || act === "down") return this._step(i, act === "up" ? 1 : -1);
    if (act === "open" || act === "close" || act === "stop") return rcCall(h, "cover", `${act}_cover`, id);
    if (act === "playpause") return rcCall(h, "media_player", "media_play_pause", id);
    if (act === "power") return rcCall(h, "media_player", "turn_on", id);
    if (act === "toggle") return rcCall(h, "homeassistant", "toggle", id);
    if (act === "press") {
      const [domain, service] = RM_PRESS[i.domain];
      return rcCall(h, domain, service, id);
    }
  }

  // − / +: the set temperature moves by the entity's step at once on the row, and goes out once the taps pause.
  _step(i, dir) {
    const a = i.st.attributes;
    const step = rmNum(a.target_temp_step) ?? (a.temperature_unit === "°F" || this._hass.config?.unit_system?.temperature === "°F" ? 1 : 0.5);
    const lo = rmNum(a.min_temp) ?? 5;
    const hi = rmNum(a.max_temp) ?? 35;
    this._pend ||= {};
    const next = Math.min(hi, Math.max(lo, Math.round(((this._pend[i.id] ?? i.target) + dir * step) / step) * step));
    this._pend[i.id] = next;
    const row = [...this.shadowRoot.querySelectorAll(".row")].find((r) => r.dataset.id === i.id);
    const val = row?.querySelector(".val");
    if (val) val.textContent = this._fmtTemp(next);
    clearTimeout(this._stepTimer);
    this._stepTimer = setTimeout(() => {
      const pend = this._pend;
      this._pend = {};
      for (const [entity_id, temperature] of Object.entries(pend)) rcCall(this._hass, "climate", "set_temperature", { entity_id, temperature });
    }, 700);
  }

  _draw(items) {
    const status = this._status(items);
    const level = items.some((i) => i.on) ? "on" : "off";
    if (!this._changed([items.map((i) => [i.id, i.cls, i.state, i.target, i.pos, i.on, i.name, i.icon, i.st.attributes.supported_features]), this._pend])) return;
    this._shown = items.length;
    const kind = RM_CONTROL_KINDS[this._config.kind] || RM_CONTROL_KINDS.custom;
    const head = this._head({ icon: kind.icon, title: this._config.title || this._t(`sec_${this._config.kind}`), status });
    this._paint(level, head, "");
  }

  getCardSize() {
    return 1 + (this._items?.length || 0);
  }
}

if (!customElements.get(RoomControlsSection.tag)) customElements.define(RoomControlsSection.tag, RoomControlsSection);

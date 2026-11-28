// ── Card ─────────────────────────────────────────────────────────────────────
import { RS_KINDS, RS_PREFIX, RS_SUFFIX, rsKindOf } from "./sensor-kinds.js";
import { RS_I18N } from "./i18n/rs-i18n.js";

export class RoomSensorsCard extends RcCard {
  static tag = "room-sensors-card";
  static i18n = RS_I18N;
  static needsArea = true;
  static includeDomains = ["binary_sensor"];
  static sceneTheme = "sensors";
  static defaults = { columns: 2, layout: "compact", only_alerts: false, hide_when_clear: false, presence: true, blink: true, exclude: [] };

  _candidate(id) {
    return rcMatchSensor(this._hass, id, {
      presence: this._config.presence,
      outdoor: this._config.outdoor ?? rcIsOutdoor(this._hass.areas?.[this._config.area]),
    });
  }

  // The "since" labels move with the clock, not only with the states: redrawn every minute while the card is shown
  // (the signature skips the redraw when no label changed; never during a press).
  connectedCallback() {
    super.connectedCallback?.();
    clearInterval(this._clock);
    this._clock = setInterval(() => {
      if (!this._pressing && !this._dragging) this._render();
    }, 60000);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearInterval(this._clock);
    this._clock = null;
  }

  _stateText(kind, on) {
    if (RS_KINDS[kind].info) return this._t(`${kind}_${on ? "on" : "off"}`);
    if (RS_KINDS[kind].fem && RS_I18N[this._lang()]?.open_f) return this._t(on ? "open_f" : "closed_f");
    return this._t(on ? "open" : "closed");
  }

  // Open doors and windows first, then detected presence, then the rest.
  _rank(i) {
    if (!i.on) return 0;
    return i.info ? 1 : 2;
  }

  _ago(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return this._t("now");
    if (s < 3600) return this._t("min", { n: Math.floor(s / 60) });
    if (s < 86400) return this._t("hour", { n: Math.floor(s / 3600) });
    return this._t("day", { n: Math.floor(s / 86400) });
  }

  _collect() {
    const areaName = this._areaName();
    return this._entries()
      .map((e) => {
        const st = this._hass.states[e.entity];
        const kind = rsKindOf(st);
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        return {
          id: e.entity,
          kind,
          info: !!RS_KINDS[kind].info,
          on,
          unavailable,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RS_PREFIX, RS_SUFFIX),
          // The icon set on the entity (its registry settings, or a template's `icon`) wins over the kind's (#115).
          icon: e.icon ?? this._hass.entities?.[e.entity]?.icon ?? st.attributes.icon ?? (on ? RS_KINDS[kind].on : RS_KINDS[kind].off),
          state: unavailable ? this._t("unavailable") : this._stateText(kind, on),
          since: st.last_changed,
        };
      })
      .sort((a, b) => this._rank(b) - this._rank(a) || a.name.localeCompare(b.name));
  }

  // The banner: the window opens with an open window (or patio door), the door with any other opening, someone walks
  // in on a presence.
  _sceneState() {
    const on = (kinds) => (this._items || []).some((i) => i.on && kinds.includes(i.kind));
    return {
      window: on(["window", "slide"]),
      door: on(["door", "garage", "opening"]),
      motion: on(["presence", "motion"]),
    };
  }

  // State of the room, shared by the full and the mini card. An unavailable opening sensor is no all-clear: it warns
  // (*2 unavailable*) like an open one.
  _summary(items) {
    const open = items.filter((i) => !i.info && i.on).length;
    const unavail = items.filter((i) => !i.info && i.unavailable).length;
    const warn = open || unavail;
    return {
      open,
      occupied: items.some((i) => i.info && i.on),
      level: warn ? "warn" : "ok",
      icon: warn ? "mdi:shield-alert-outline" : "mdi:shield-home-outline",
      status: this._openingStatus(open, items.some((i) => !i.info), items.length ? "all_quiet" : "no_sensors", unavail),
    };
  }

  // The summary and the sensors to draw, or null when nothing changed since `parts` were last drawn or the card is
  // hidden (`hide_when_clear`: only when everything is closed and reporting, and nobody is there).
  _visible(items, parts) {
    const c = this._config;
    const sum = this._summary(items);
    if (!this._changed(parts)) return null;
    if (this._hide(c.hide_when_clear && sum.level === "ok" && !sum.occupied)) return null;
    const shown = c.only_alerts ? items.filter((i) => i.on || i.unavailable) : items;
    this._shown = shown.length;
    return { ...sum, shown };
  }

  _draw(items) {
    const c = this._config;
    // The "since" label moves every minute; computed once per item (signature, then tile).
    const ago = new Map(items.map((i) => [i.id, i.on ? this._ago(i.since) : ""]));
    const v = this._visible(items, items.map((i) => [i.id, i.on, i.unavailable, i.name, ago.get(i.id)]));
    if (!v) return;
    const { occupied, level, icon, status, shown } = v;
    const tiles = shown
      .map((i) =>
        this._tile(i, {
          cls: i.info ? " info" : "",
          state: `${rcEsc(i.state)}${i.on ? ` · <span class="since">${rcEsc(ago.get(i.id))}</span>` : ""}`,
        }),
      )
      .join("");
    const chips = occupied
      ? `<div class="chip" title="${rcEsc(this._t("occupied"))}"><ha-icon icon="mdi:account"></ha-icon></div>`
      : "";
    const head = this._head({
      icon,
      title: c.title || this._areaName() || this._t("title"),
      status,
      chips,
    });
    this._paint(level, head, tiles, c.blink === false ? " no-blink" : "");
  }

  // A tap opens the details: a sensor cannot be toggled.
  _bindTile(el) {
    el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id), this._on);
  }

  static styles = `
    ha-card.lvl-ok    { --c: var(--rc-ok); }
    ha-card.lvl-warn  { --c: var(--rc-warn); }
    .chip { flex: none; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
            color: var(--rc-info); background: color-mix(in srgb, var(--rc-info) 14%, transparent); }
    .chip ha-icon { --mdc-icon-size: 13px; }
    .tile { --t: var(--rc-ok); }
    .tile.on      { --t: var(--rc-warn); }
    .tile.on.info { --t: var(--rc-info); }
    .tile:not(.off) .state { color: var(--t); }
    .tile.on:not(.info) .ic { animation: rc-blink 1.5s ease-in-out infinite; }
    .since { opacity: .8; }
    .no-blink .tile.on .ic { animation: none; }
    @media (prefers-reduced-motion: reduce) { .tile.on .ic { animation: none; } }
  `;
}

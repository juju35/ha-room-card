// ── Card ─────────────────────────────────────────────────────────────────────
import { RM_CONTROLS, RM_ENV, RM_ORDER, RM_SECTIONS, rmRoute, rmTitle } from "./sections.js";
import { rmColor, rmIndicatorActive, rmIndicators } from "./indicators.js";
import { RM_I18N } from "./i18n/rm-i18n.js";

export class RoomCard extends RcCard {
  static tag = "room-card";
  static i18n = RM_I18N;
  static needsArea = true;
  static includeDomains = ["light", "switch", "binary_sensor", "sensor", "climate", "cover", "media_player"];
  static includeMatch = (hass, id) => !id.startsWith("sensor.") || !!customElements.get("room-environment-card")?.includeMatch?.(hass, id);
  static sceneTheme = "room";
  // The indicators' condition and colour rules, for the tests.
  static indicatorActive = rmIndicatorActive;
  static indicatorColor = rmColor;
  static defaults = { columns: 2, layout: "compact", show_environment: true, auto_indicators: true, exclude: [] };

  // The sections shown, in their order (`sections`, all of them by default).
  _sections() {
    const list = (this._config.sections || []).filter((k) => k in RM_SECTIONS);
    return list.length ? [...new Set(list)] : RM_ORDER;
  }

  // The config of each embedded card: the room's area, `exclude`, the `include` entities of its kind, the tiles' layout.
  _kidConfigs() {
    const c = this._config;
    const lang = this._lang();
    const inc = {};
    for (const e of c.include || []) {
      const id = typeof e === "string" ? e : e?.entity;
      const key = id && rmRoute(this._hass || { states: {} }, id);
      if (key) (inc[key] ||= []).push(e);
    }
    const base = {
      ...(c.area ? { area: c.area } : {}),
      exclude: c.exclude || [],
      illustration: false,
      embedded: true,
      ...(c.names ? { names: c.names } : {}),
      ...(c.language ? { language: c.language } : {}),
    };
    const tiles = { columns: c.columns, layout: c.layout };
    const out = {};
    for (const key of this._sections()) {
      const tag = RM_SECTIONS[key];
      if (RM_CONTROLS.includes(key)) {
        // A control section: its kind, the entities it shows (`custom_entities` for the custom one).
        if (key === "custom" && !c.custom_entities?.length) continue;
        out[key] = {
          type: `custom:${tag}`,
          ...base,
          kind: key,
          title: rmTitle(key, lang),
          include: inc[key] || [],
          ...(key === "custom" ? { entities: c.custom_entities } : {}),
        };
        continue;
      }
      out[key] = {
        type: `custom:${tag}`,
        ...base,
        ...tiles,
        title: rmTitle(key, lang),
        include: inc[key] || [],
        ...(key === "sensors" && c.presence !== undefined ? { presence: c.presence } : {}),
      };
    }
    if (c.show_environment !== false) {
      out.environment = { type: `custom:${RM_ENV}`, ...base, include: inc.environment || [], zoom: false, show_history: false };
    }
    return out;
  }

  // The embedded cards, built again when the config, the language or the registries change (an `include` entity's
  // section depends on its name). A section whose card cannot run (no area and nothing included for it) is left out.
  _ensureKids() {
    const h = this._hass;
    const deps = [this._config, this._lang(), h.entities, h.devices];
    if (this._kids && this._kidDeps?.every((d, i) => d === deps[i])) return;
    this._kidDeps = deps;
    this._kidsGen = (this._kidsGen || 0) + 1;
    const folded = (this._folded ||= new Set(this._config.collapsed || []));
    this._kids = {};
    for (const [key, config] of Object.entries(this._kidConfigs())) {
      const tag = config.type.slice(7);
      if (!customElements.get(tag)) continue;
      const el = document.createElement(tag);
      try {
        el.setConfig(config);
      } catch {
        continue;
      }
      el.toggleAttribute?.("collapsed", folded.has(key));
      el.addEventListener("rc-fold", (ev) => {
        if (ev.detail.collapsed) folded.add(key);
        else folded.delete(key);
      });
      // Its own visibility is not the room card's: kept from reaching Lovelace.
      el.addEventListener("card-visibility-changed", (ev) => ev.stopPropagation());
      this._kids[key] = el;
    }
  }

  // What the room shows, for the editor's lists (include, exclude, names): what each embedded card finds.
  _entries() {
    return Object.values(this._kidConfigs()).flatMap(({ type, ...config }) => {
      const card = customElements.get(type.slice(7));
      return card ? rcProbe(card, this._hass, config)._entries() : [];
    });
  }

  // Left (another dashboard view, a conditional card hidden): the sections come back as configured.
  disconnectedCallback() {
    super.disconnectedCallback();
    this._folded = new Set(this._config?.collapsed || []);
    for (const [key, el] of Object.entries(this._kids || {})) el.toggleAttribute?.("collapsed", this._folded.has(key));
  }

  // Every embedded card brought up to date (they draw themselves), and the room's state from what they found.
  _collect() {
    this._ensureKids();
    for (const el of Object.values(this._kids)) el.hass = this._hass;
    const items = (key) => this._kids[key]?._items || [];
    const lights = items("lights");
    const plugs = items("plugs");
    const sensors = items("sensors");
    const env = items("environment");
    const lit = lights.filter((i) => i.on);
    const plugsOn = plugs.filter((i) => i.on);
    const controls = Object.fromEntries(RM_CONTROLS.map((k) => [k, items(k)]));
    return {
      controls,
      lights,
      plugs,
      sensors,
      env,
      lit,
      plugsOn,
      watts: plugsOn.some((i) => i.watts != null) ? plugsOn.reduce((t, i) => t + (i.watts ?? 0), 0) : null,
      sens: sensors.length ? this._kids.sensors._summary(sensors) : null,
      worst: env.length ? this._kids.environment._worst(env) : null,
    };
  }

  // The banner's state, its icon and status: an open door or window first, then a reading needing a look, then someone
  // there, then the lights on.
  _summary(x) {
    const { sens, worst, lit } = x;
    const envWarn = worst && (worst.sev === "warn" || worst.sev === "alert");
    const area = this._hass.areas?.[this._config.area];
    if (sens?.level === "warn") return { level: "warn", icon: "mdi:home-alert-outline", status: sens.status };
    if (envWarn) return { level: worst.sev, icon: "mdi:home-alert-outline", status: this._kids.environment._status(x.env, worst) };
    const icon = area?.icon || "mdi:home-outline";
    if (sens?.occupied) return { level: "info", icon, status: this._t("occupied") };
    if (lit.length) return { level: "on", icon, status: this._tn("lights_on", lit.length) };
    return { level: "ok", icon, status: this._t("all_quiet") };
  }

  // The indicators after the lights, plugs and presence (#114): heating, cooling, covers open, playing, an appliance
  // running (unless `auto_indicators: false`), then the `indicators` of the config that are active.
  _indicators(x) {
    return rmIndicators(this, x);
  }

  // The header chips: someone there, the lights on, the plugs on (their power draw when they report it), the indicators.
  _chips(x) {
    const chip = (cls, icon, label, text, style = "") =>
      `<span class="chip ${cls}"${style ? ` style="${rcEsc(style)}"` : ""} title="${rcEsc(label)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</span>`;
    return [
      x.sens?.occupied ? chip("info", "mdi:account", this._t("occupied"), "") : "",
      x.lit.length ? chip("light", "mdi:lightbulb", this._t("chip_lights"), String(x.lit.length)) : "",
      x.plugsOn.length
        ? chip("plug", "mdi:power-socket-fr", this._t("chip_plugs"), x.watts != null ? rcWatts(x.watts, this._lang()) : String(x.plugsOn.length))
        : "",
      ...this._indicators(x).map((i) => chip(i.cls, i.icon, i.label, i.text, i.style)),
    ].join("");
  }

  _sceneState() {
    const x = this._items;
    if (!x) return {};
    return {
      lamp: x.lit[0] ? { on: true, color: x.lit[0].color } : { on: false },
      window: x.sensors.some((i) => !i.info && i.on),
      motion: !!x.sens?.occupied,
      plug: x.plugsOn.length > 0,
    };
  }

  _sigOf(x, sum) {
    return [
      sum,
      x.lit.map((i) => [i.id, i.color]),
      x.plugsOn.length,
      x.watts == null ? null : Math.round(x.watts),
      this._sceneState(),
      this._indicators(x),
      ...["lights", "plugs", "sensors", "environment", ...RM_CONTROLS].map((k) => this._kids[k]?._items?.length ?? -1),
    ];
  }

  getCardSize() {
    if (this.hidden || !this._kids) return 1;
    return 2 + Object.values(this._kids).reduce((t, el) => t + (el._items?.length ? el.getCardSize() : 0), 0);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  // The card is drawn once (banner, readings, sections) and kept: the embedded cards draw themselves inside it, the
  // banner and the sections' visibility follow the room.
  _draw(x) {
    const c = this._config;
    const root = this.shadowRoot;
    if (this._view !== "full") {
      root.innerHTML = "";
      this._view = "full";
    }
    if (this._shellOnce(this.constructor.styles, '<div class="env"></div><div class="secs"></div><div class="empty" hidden></div>')) {
      this._placed = null;
      this._sig = null;
      const head = root.querySelector(".head");
      if (head && c.navigation_path) {
        head.classList.add("nav");
        head.setAttribute("role", "link");
        head.tabIndex = 0;
        rcBindNav(head, c.navigation_path);
      }
    }
    this._place();
    const sum = this._summary(x);
    if (!this._changed(["full", this._sigOf(x, sum)])) return;
    const card = root.querySelector("ha-card");
    if (!card) return;
    card.className = `lvl-${sum.level}`;
    const title = rcEsc(c.title || this._areaName() || this._t("title"));
    const pill = `<div class="pill" title="${rcEsc(sum.status)}"><span class="pt">${rcEsc(sum.status)}</span></div>`;
    const chips = this._chips(x);
    const hchips = chips ? `<div class="hchips">${chips}</div>` : "";
    if (this._illustrated()) {
      this._updateBanner(card.querySelector(".banner"));
      rcMorph(
        card.querySelector(".head"),
        `<div class="badge"><ha-icon icon="${rcEsc(sum.icon)}"></ha-icon></div><div class="titles"><div class="trow"><div class="title">${title}</div>${pill}</div>${hchips}</div>`,
      );
    } else {
      rcMorph(card.querySelector(".head"), `<div class="badge"><ha-icon icon="${rcEsc(sum.icon)}"></ha-icon></div><div class="title">${title}</div>${hchips}${pill}`);
    }
    this._fitPill();
  }

  // The embedded cards in their places (again only when they were rebuilt), each shown only when it found something.
  _place() {
    const root = this.shadowRoot;
    const env = root.querySelector(".env");
    const secs = root.querySelector(".secs");
    if (!env || !secs) return;
    if (this._placed !== this._kidsGen) {
      this._placed = this._kidsGen;
      env.replaceChildren(...(this._kids.environment ? [this._kids.environment] : []));
      secs.replaceChildren(
        ...this._sections()
          .filter((k) => this._kids[k])
          .map((k) => {
            const wrap = document.createElement("div");
            wrap.className = "sec";
            wrap.dataset.sec = k;
            wrap.appendChild(this._kids[k]);
            return wrap;
          }),
      );
    }
    const has = (el) => !!el?._items?.length;
    env.hidden = !has(this._kids.environment);
    let any = !env.hidden;
    for (const wrap of secs.children) {
      wrap.hidden = !has(this._kids[wrap.dataset.sec]);
      any ||= !wrap.hidden;
    }
    const empty = root.querySelector(".empty");
    if (empty) {
      empty.hidden = any;
      if (!any && empty.textContent !== this._t("no_entities")) empty.textContent = this._t("no_entities");
    }
  }

  static styles = `${RC_CHIP_STYLES}
    .chip.heat { --k: var(--rc-warn); }
    .chip.cool, .chip.cover { --k: var(--rc-info); }
    .chip.media { --k: var(--rc-media, #9c6ade); }
    .chip.run { --k: var(--rc-ok); }
    .chip.alert { --k: var(--rc-alert); }
    .chip.custom { --k: var(--ind, var(--rc-idle)); }
    ha-card { position: relative; }
    ha-card.lvl-ok   { --c: var(--rc-ok); }
    ha-card.lvl-on   { --c: var(--rc-light); }
    ha-card.lvl-info { --c: var(--rc-info); }
    ha-card.lvl-warn { --c: var(--rc-warn); }
    ha-card.lvl-alert { --c: var(--rc-alert); }
    /* The embedded cards: no frame nor background of their own, flush with the room card's edges, a hairline between
       the sections. */
    .env, .secs { margin: 0 -12px; --ha-card-background: transparent; --card-background-color: transparent;
                  --ha-card-box-shadow: none; --ha-card-border-width: 0; --ha-card-border-radius: 0; }
    .env { margin-top: 2px; margin-bottom: -6px; }
    .env > *, .sec > * { display: block; }
    .env[hidden], .sec[hidden] { display: none; }
    .sec + .sec:not([hidden]), .sec:not([hidden]) ~ .sec:not([hidden]) { border-top: 1px solid var(--divider-color, rgba(127,127,127,.15)); }
    .secs { margin-bottom: -12px; }
    .empty { padding: 12px 0 0; text-align: center; font-size: 13px; color: var(--secondary-text-color); }
    .empty[hidden] { display: none; }
  `;
}

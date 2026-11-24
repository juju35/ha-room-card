// ── Base card ────────────────────────────────────────────────────────────────
import { RC_HOLD_MS, RC_MOVE_PX, RC_REPEAT_MS } from "./discovery-rules.js";
import { rcBindFold, rcBindNav, rcEsc, rcLang, rcMoreInfo, rcPluralKey, rcT, textWidth } from "./helpers.js";
import { rcCall, rcMemo, rcMorph } from "./in-place-redraw.js";
import { RC_BASE_STYLES } from "./common-styles.js";

export class RcCard extends HTMLElement {
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
    // embedded: a section of the Room card (no frame, a foldable header), set by the Room card itself.
    this.toggleAttribute?.("embedded", config.embedded === true);
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
    if (c.embedded) {
      const open = !this.hasAttribute?.("collapsed");
      return `
      <div class="head fold" role="button" tabindex="0" aria-expanded="${open}">
        <div class="badge"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
        <div class="title">${rcEsc(title)}</div>
        ${chips}
        <button class="pill${allOff ? " action" : ""}" title="${rcEsc(allOff ? this._t("turn_all_off") : status)}"${allOff ? "" : " disabled"}>
          ${allOff ? '<ha-icon icon="mdi:power"></ha-icon>' : ""}<span class="pt">${rcEsc(status)}</span>
        </button>
        <span class="rc-fold" aria-hidden="true"></span>
      </div>`;
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
    if (this._config.embedded) rcBindFold(this, root.querySelector(".head.fold"), on);
    else if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path, on);
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
export class RcToggleCard extends RcCard {
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

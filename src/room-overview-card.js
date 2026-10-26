/**
 * room-overview-card — compact Lovelace card giving an overview of every room:
 * openings and leaks, presence, lights and plugs, one tile per room.
 * Tap a room to unfold its details (room-sensors-card, room-lights-card and
 * room-switch-card). Uses src/shared.js. https://github.com/juju35/ha-room-card
 */

// ── i18n ─────────────────────────────────────────────────────────────────────
const RO_I18N = {
  en: {
    title: "Home",
    presence: "Presence",
    no_rooms: "No room with sensors, lights or plugs",
    lights_on: "Lights on",
    plugs_on: "Plugs on",
    turn_lights_off: "Turn all lights off",
    turn_plugs_off: "Turn all plugs off",
    confirm_plugs_one: "Turn this plug off?",
    confirm_plugs_many: "Turn these {n} plugs off?",
    turn_off: "Turn off",
    cancel: "Cancel",
    rooms_occupied: "Occupied rooms",
    sensors: "Sensors",
    lights: "Lights",
    plugs: "Plugs",
    open: "Open",
    closed: "Closed",
    detected: "Detected",
    clear: "Clear",
    ed_title_helper: "Leave empty for “Home”",
    ed_columns_helper: "Empty: 3, or 2 on narrow screens",
    ed_presence: "Include presence sensors",
    ed_presence_helper: "Presence and motion sensors, cameras excluded",
    ed_zoom: "Detail button",
    ed_zoom_helper: "Only the rooms with something open, on or detected show; the button shows every room. Off: every room, always",
    ed_all_off_button: "“Turn all lights off” button",
    ed_all_off_button_helper: "Tapping the lights chip of the header turns every light the card counts off",
    ed_plugs_off_button: "“Turn all plugs off” button",
    ed_plugs_off_button_helper:
      "Tapping the plugs chip of the header lists every plug the card counts that is on and turns them off once confirmed; also on the Plugs card of the room details. Off by default: a plug may feed a camera or a network switch",
    ed_sort: "Sort",
    ed_sort_name: "By name",
    ed_sort_state: "Rooms needing attention first",
    ed_exclude_areas: "Rooms to exclude",
    ed_exclude: "Entities to exclude",
    ed_exclude_helper: "Left out of the tiles, the totals and the room details",
  },
  fr: {
    title: "Maison",
    presence: "Présence",
    no_rooms: "Aucune pièce avec des capteurs, lumières ou prises",
    lights_on: "Lumières allumées",
    plugs_on: "Prises allumées",
    turn_lights_off: "Éteindre toutes les lumières",
    turn_plugs_off: "Éteindre toutes les prises",
    confirm_plugs_one: "Éteindre cette prise ?",
    confirm_plugs_many: "Éteindre ces {n} prises ?",
    turn_off: "Éteindre",
    cancel: "Annuler",
    rooms_occupied: "Pièces occupées",
    sensors: "Capteurs",
    lights: "Lumières",
    plugs: "Prises",
    open: "Ouvert",
    closed: "Fermé",
    detected: "Détectée",
    clear: "Aucune",
    ed_title_helper: "Laisser vide pour « Maison »",
    ed_columns_helper: "Vide : 3, ou 2 sur les écrans étroits",
    ed_presence: "Inclure les capteurs de présence",
    ed_presence_helper: "Capteurs de présence et de mouvement, hors caméras",
    ed_zoom: "Bouton détail",
    ed_zoom_helper: "Seules les pièces avec quelque chose d'ouvert, d'allumé ou de détecté s'affichent ; le bouton affiche toutes les pièces. Désactivé : toujours toutes les pièces",
    ed_all_off_button: "Bouton « Éteindre toutes les lumières »",
    ed_all_off_button_helper: "Un tap sur la pastille des lumières de l'en-tête éteint toutes les lumières comptées par la carte",
    ed_plugs_off_button: "Bouton « Éteindre toutes les prises »",
    ed_plugs_off_button_helper:
      "Un tap sur la pastille des prises de l'en-tête liste les prises allumées comptées par la carte et les éteint après confirmation ; aussi sur la carte Prises du détail des pièces. Désactivé par défaut : une prise peut alimenter une caméra ou un switch réseau",
    ed_sort: "Tri",
    ed_sort_name: "Par nom",
    ed_sort_state: "Pièces à surveiller en premier",
    ed_exclude_areas: "Pièces à exclure",
    ed_exclude: "Entités à exclure",
    ed_exclude_helper: "Ignorées dans les tuiles, les totaux et le détail des pièces",
  },
};

// After the confirmation popup closes, clicks are ignored for this long: the second click of a double click on OK
// would otherwise land on what lies under the button (the lights chip, a room tile).
const RO_CLOSED_GUARD_MS = 400;

// ── Card ─────────────────────────────────────────────────────────────────────
class RoomOverviewCard extends RcCard {
  static tag = "room-overview-card";
  static i18n = RO_I18N;
  static defaults = {
    presence: true,
    zoom: true,
    all_off_button: true,
    plugs_off_button: false,
    sort: "name",
    exclude_areas: [],
    exclude: [],
    rooms: [],
  };

  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    // A click anywhere else folds the open room back, and returns to the rooms needing attention.
    this._onOutside = (ev) => {
      if (!rcOutside(this, ev)) return;
      if (this._confirm) this._closeConfirm();
      if (this._openArea) this._toggle(null);
      rcUnzoom(this);
    };
    // Escape closes the confirmation popup (as Cancel), wherever the focus is.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  // A new config rebuilds the room details, which take part of it (language, presence, exclude, plugs_off_button).
  setConfig(config) {
    this._panelArea = null;
    super.setConfig(config);
  }

  set hass(hass) {
    super.hass = hass;
    for (const el of this._details || []) el.hass = hass;
  }

  connectedCallback() {
    document.addEventListener("click", this._onOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
    if (this._confirm) this._closeConfirm();
    // A press cut short by the detach never gets its pointerup: end it, or the header stays frozen.
    if (this._pressing) this._released();
  }

  getCardSize() {
    return 1 + Math.ceil((this._rooms?.length || 1) / 3);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  _collect() {
    const h = this._hass;
    const c = this._config;
    const reg = h.entities || {};

    const cameras = rcCameraDevices(h);
    const power = rcPowerSensors(h);
    const watts = (id) => rcWattsOf(h, power[reg[id]?.device_id]);

    const rooms = {};
    const room = (aid) => {
      if (!rooms[aid]) {
        rooms[aid] = { id: aid, sensors: [], presence: [], lights: [], plugs: [] };
      }
      return rooms[aid];
    };

    // The room cards' own rules, so that a room counts what its unfolded details show.
    for (const [id, aid] of rcByArea(this, (id) => /^(binary_sensor|light|switch)\./.test(id))) {
      const st = h.states[id];
      if (!st) continue;
      const dc = st.attributes.device_class;
      if (rcMatchSensor(h, id, { presence: c.presence, cameras })) {
        if (RC_OPENING_CLASSES.includes(dc)) room(aid).sensors.push({ id, leak: dc === "moisture", st });
        else room(aid).presence.push({ id, st });
      } else if (rcMatchLight(h, id)) {
        room(aid).lights.push({ id, st });
      } else if (rcMatchPlug(h, id)) {
        room(aid).plugs.push({ id, st, watts: watts(id) });
      }
    }

    const exclude = new Set(c.exclude_areas || []);
    const overrides = Object.fromEntries((c.rooms || []).map((x) => [x.area, x]));

    let list = Object.values(rooms)
      .filter((x) => !exclude.has(x.id) && h.areas?.[x.id])
      .map((x) => {
        const area = h.areas[x.id];
        const o = overrides[x.id] || {};
        const on = (e) => e.st.state === "on";
        const plugsOn = x.plugs.filter(on);
        const plugWatts = plugsOn.filter((p) => p.watts != null);
        return {
          ...x,
          name: o.name ?? area.name ?? x.id,
          icon: o.icon ?? rcRoomIcon(area),
          navigation_path: o.navigation_path,
          leaks: x.sensors.filter((s) => s.leak && on(s)).length,
          open: x.sensors.filter((s) => !s.leak && on(s)).length,
          occupied: x.presence.some(on),
          lightsOn: x.lights.filter(on).length,
          plugsOn: plugsOn.length,
          watts: plugWatts.length ? plugWatts.reduce((t, p) => t + p.watts, 0) : null,
        };
      });

    const rank = (x) => (x.leaks ? 4 : x.open ? 3 : x.occupied ? 2 : x.lightsOn || x.plugsOn ? 1 : 0);
    rcSortRooms(list, c, rank);
    this._total = list.length;
    this._anySensors = list.some((x) => x.sensors.some((e) => !e.leak));
    if (rcCompact(this)) list = list.filter((x) => rank(x) > 0 || x.id === this._openArea);
    return list;
  }

  _roomState(x) {
    if (x.leaks || x.open) return { lvl: x.leaks ? "alert" : "warn", text: this._openingStatus(x.leaks, x.open) };
    if (x.occupied) return { lvl: "info", text: this._t("presence") };
    return { lvl: "ok", text: this._openingStatus(0, 0, x.sensors.some((e) => !e.leak)) };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const rooms = this._collect();
    this._rooms = rooms;

    const parts = rooms.map((x) => [x.id, x.name, x.icon, x.leaks, x.open, x.occupied, x.lightsOn, x.plugsOn, x.watts && Math.round(x.watts)]);
    // The plain list of the open room (no room card installed) shows every entity's state.
    const shown = this._fallback && rooms.find((x) => x.id === this._openArea);
    const list = shown
      ? [...shown.sensors, ...shown.presence, ...shown.lights, ...shown.plugs].map((e) => [e.id, e.st.state, e.st.attributes.friendly_name])
      : null;
    if (!this._changed([this._openArea, this._zoomed, parts, list])) return;

    if (!this.shadowRoot.querySelector("ha-card")) {
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${RoomOverviewCard.styles}</style>
        <ha-card><div class="head"></div><div class="panel" hidden></div><div class="grid"></div><div class="confirm" hidden></div></ha-card>`;
      // Just after the popup closed, the second click of a double click on OK lands on what lies under it: the header,
      // a room tile, or a tile of the unfolded room's details (room-* cards acting on pointerup). Swallowed here, in
      // the capture phase, before it reaches any of them.
      const card = this.shadowRoot.querySelector("ha-card");
      for (const type of ["pointerdown", "pointerup", "click"]) {
        card.addEventListener(
          type,
          (ev) => {
            if (this._justClosed()) ev.stopPropagation();
          },
          true,
        );
      }
      const head = this.shadowRoot.querySelector(".head");
      head.addEventListener("click", (ev) => {
        if (rcZoomClick(this, ev)) return;
        const button = ev.target.closest(".chip.action");
        if (!button || this._justClosed()) return;
        ev.stopPropagation();
        this._headAction(button.dataset.kind === "plugs" ? "plugs" : "lights");
      });
      // No header rewrite while an action chip is pressed (a power reading changes its text): the chip under the
      // finger would be replaced and the click lost. The update is rendered once the click is through.
      head.addEventListener("pointerdown", (ev) => {
        if (ev.button === 0 && ev.target.closest(".chip.action")) this._pressing = true;
      });
      for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
        head.addEventListener(type, () => {
          if (this._pressing) setTimeout(() => this._released());
        });
      }
      this.shadowRoot.querySelector(".grid").addEventListener("click", (ev) => {
        const tile = ev.target.closest(".room");
        if (tile && !this._justClosed()) this._tap(tile.dataset.area);
      });
      this.shadowRoot.querySelector(".confirm").addEventListener("click", (ev) => {
        ev.stopPropagation();
        const el = ev.target.closest("[data-action]");
        const action = el?.dataset.action;
        if (action === "ok") {
          const ids = this._confirm.map((e) => e.id);
          this._closeConfirm();
          rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
        } else if (action === "cancel" || (action === "backdrop" && ev.target === el)) {
          this._closeConfirm();
        }
      });
    }

    const leaks = rooms.reduce((t, x) => t + x.leaks, 0);
    const open = rooms.reduce((t, x) => t + x.open, 0);
    const lights = rooms.reduce((t, x) => t + x.lightsOn, 0);
    const plugs = rooms.reduce((t, x) => t + x.plugsOn, 0);
    const watts = rooms.some((x) => x.watts != null) ? rooms.reduce((t, x) => t + (x.watts ?? 0), 0) : null;
    const occupied = rooms.filter((x) => x.occupied).length;
    const level = leaks ? "alert" : open ? "warn" : "ok";
    const status = this._openingStatus(leaks, open, this._anySensors);
    const headIcon = leaks ? "mdi:water-alert" : open ? "mdi:home-alert-outline" : "mdi:home-outline";

    const chip = (cls, icon, label, text) =>
      `<span class="chip ${cls}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</span>`;
    // Header chip that turns everything of its kind off when tapped.
    const offChip = (cls, kind, icon, label, text, offIcon) =>
      `<button class="chip ${cls} action" data-kind="${kind}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon><span>${rcEsc(text)}</span><ha-icon class="off" icon="${offIcon}"></ha-icon></button>`;
    const plugText = watts != null ? rcWatts(watts) : String(plugs);

    const card = this.shadowRoot.querySelector("ha-card");
    card.className = `lvl-${level}`;
    card.querySelector(".head").innerHTML = `
      <div class="badge"><ha-icon icon="${headIcon}"></ha-icon></div>
      <div class="title">${rcEsc(c.title || this._t("title"))}</div>
      ${occupied ? chip("info", "mdi:account", this._t("rooms_occupied"), String(occupied)) : ""}
      ${
        lights
          ? c.all_off_button !== false
            ? offChip("light", "lights", "mdi:lightbulb", this._t("turn_lights_off"), String(lights), "mdi:power")
            : chip("light", "mdi:lightbulb", this._t("lights_on"), String(lights))
          : ""
      }
      ${
        plugs
          ? c.plugs_off_button
            ? offChip("plug", "plugs", "mdi:power-socket-fr", this._t("turn_plugs_off"), plugText, "mdi:power-plug-off")
            : chip("plug", "mdi:power-socket-fr", this._t("plugs_on"), plugText)
          : ""
      }
      <div class="pill">${rcEsc(status)}</div>
      ${rcZoomButton(this)}`;

    this._roomGrid(card.querySelector(".grid"), rooms, (x) => {
      const s = this._roomState(x);
      // Chips only add what the state line does not already say.
      const chips = [
        x.leaks && x.open ? chip("warn", "mdi:door-open", this._t(x.open > 1 ? "open_many" : "open_one", { n: x.open }), String(x.open)) : "",
        x.occupied && s.lvl !== "info" ? chip("info", "mdi:account", this._t("presence")) : "",
        x.lightsOn ? chip("light", "mdi:lightbulb", this._t("lights_on"), String(x.lightsOn)) : "",
        x.plugsOn
          ? chip("plug", "mdi:power-socket-fr", this._t("plugs_on"), x.watts != null ? rcWatts(x.watts) : String(x.plugsOn))
          : "",
      ].join("");
      return `
      <button class="room lvl-${s.lvl}${x.id === this._openArea ? " sel" : ""}" data-area="${rcEsc(x.id)}"
              title="${rcEsc(x.name)} — ${rcEsc(s.text)}">
        <span class="ic"><ha-icon icon="${rcEsc(x.icon)}"></ha-icon></span>
        <span class="name">${rcEsc(x.name)}</span>
        <span class="state">${rcEsc(s.text)}</span>
        <span class="chips">${chips}</span>
      </button>`;
    });
  }

  // What a header chip turns off: every light, or every plug, that is on in the rooms shown. Lights go off at once;
  // plugs only once the list is confirmed, since one of them may feed a fridge, a camera or the network.
  _headAction(kind) {
    const on = this._rooms.flatMap((x) => x[kind].filter((e) => e.st.state === "on").map((e) => ({ ...e, room: x.name })));
    if (!on.length) return;
    if (kind === "plugs") this._openConfirm(on);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: on.map((e) => e.id) });
  }

  // In-card confirmation at the top of the card (as in ha-system-monitor-card and ha-roborock-card), drawn once:
  // updates leave it, and the focus in it, alone. OK turns off the plugs listed, nothing else.
  _openConfirm(plugs) {
    this._confirm = plugs;
    const n = plugs.length;
    const items = plugs
      .map((e) => {
        const extra = [e.room, e.watts != null ? rcWatts(e.watts) : ""].filter(Boolean).join(" · ");
        return `<div class="modal-item"><span>${rcEsc(e.st.attributes.friendly_name || e.id)}</span><span>${rcEsc(extra)}</span></div>`;
      })
      .join("");
    const box = this.shadowRoot.querySelector(".confirm");
    box.innerHTML = `
      <div class="backdrop" data-action="backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${rcEsc(this._t("turn_plugs_off"))}">
          <h3>${rcEsc(this._t("turn_plugs_off"))}</h3>
          <div class="hint">${rcEsc(this._t(n > 1 ? "confirm_plugs_many" : "confirm_plugs_one", { n }))}</div>
          <div class="modal-list">${items}</div>
          <div class="modal-actions">
            <button class="act cancel" data-action="cancel">${rcEsc(this._t("cancel"))}</button>
            <button class="act primary" data-action="ok">${rcEsc(this._t("turn_off"))}</button>
          </div>
        </div>
      </div>`;
    box.hidden = false;
    window.addEventListener("keydown", this._onKey);
    box.querySelector(".primary")?.focus();
  }

  _closeConfirm() {
    this._confirm = null;
    this._closedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    const box = this.shadowRoot?.querySelector(".confirm");
    if (box) {
      box.hidden = true;
      box.innerHTML = "";
    }
  }

  _justClosed() {
    return this._closedAt != null && Date.now() - this._closedAt < RO_CLOSED_GUARD_MS;
  }

  _tap(aid) {
    const x = this._rooms.find((r) => r.id === aid);
    if (x?.navigation_path) {
      rcNavigate(x.navigation_path);
      return;
    }
    this._toggle(this._openArea === aid ? null : aid);
  }

  _toggle(aid) {
    this._openArea = aid;
    this._panelArea = null;
    this._sig = null;
    this._render();
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = !aid;
    if (!aid) {
      panel.innerHTML = "";
      this._details = [];
    }
  }

  // Details of the open room: the room-* cards when installed, a plain list otherwise.
  _fillPanel() {
    const x = this._rooms.find((r) => r.id === this._openArea);
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = false;
    const key = JSON.stringify([x.id, x.sensors.length, x.presence.length, x.lights.length, x.plugs.length]);
    if (this._panelArea === key) {
      if (this._fallback) this._fillFallback(panel, x);
      return;
    }
    this._panelArea = key;
    panel.innerHTML = "";
    this._details = [];
    this._fallback = false;

    const parts = [
      ["room-sensors-card", x.sensors.length + x.presence.length, { title: this._t("sensors"), presence: this._config.presence }],
      ["room-lights-card", x.lights.length, { title: this._t("lights") }],
      ["room-switch-card", x.plugs.length, { title: this._t("plugs"), all_off_button: this._config.plugs_off_button === true }],
    ];
    for (const [tag, count, extra] of parts) {
      if (!count || !customElements.get(tag)) continue;
      const el = document.createElement(tag);
      el.setConfig({
        type: `custom:${tag}`,
        area: x.id,
        exclude: this._config.exclude || [],
        ...(this._config.language ? { language: this._config.language } : {}),
        ...extra,
      });
      el.hass = this._hass;
      panel.appendChild(el);
      this._details.push(el);
    }
    if (!this._details.length) {
      this._fallback = true;
      this._fillFallback(panel, x);
    }
  }

  _fillFallback(panel, x) {
    const row = (e, kind) => {
      const st = e.st;
      const on = st.state === "on";
      const text = rcUnavailable(st)
        ? this._t("unavailable")
        : kind === "sensor"
          ? this._t(on ? "open" : "closed")
          : kind === "presence"
            ? this._t(on ? "detected" : "clear")
            : this._t(on ? "on" : "off");
      return `<button class="row${on ? " on" : ""}" data-id="${rcEsc(e.id)}"><span>${rcEsc(st.attributes.friendly_name || e.id)}</span><span>${rcEsc(text)}</span></button>`;
    };
    panel.innerHTML = `<div class="list">${[
      ...x.sensors.map((e) => row(e, "sensor")),
      ...x.presence.map((e) => row(e, "presence")),
      ...x.lights.map((e) => row(e, "toggle")),
      ...x.plugs.map((e) => row(e, "toggle")),
    ].join("")}</div>`;
    for (const el of panel.querySelectorAll(".row")) {
      el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }
  }

  static styles = `${RC_ZOOM_STYLES}
      ha-card { container-type: inline-size; position: relative; }
      ha-card.lvl-ok    { --c: var(--rc-ok); }
      ha-card.lvl-warn  { --c: var(--rc-warn); }
      ha-card.lvl-alert { --c: var(--rc-alert); }

      :where(button.chip) { all: unset; }
      .chip { --k: var(--rc-idle); flex: none; display: inline-flex; align-items: center; gap: 2px; height: 18px; padding: 0 5px;
              border-radius: 999px; font-size: 11px; font-weight: 500; line-height: 1; white-space: nowrap;
              color: var(--k); background: color-mix(in srgb, var(--k) 14%, transparent); }
      .head .chip { height: 20px; padding: 0 6px; font-size: 11px; }
      .chip ha-icon { --mdc-icon-size: 12px; }
      .chip:not(:has(span)) { width: 18px; padding: 0; justify-content: center; }
      .chip.alert { --k: var(--rc-alert); }
      .chip.warn  { --k: var(--rc-warn); }
      .chip.info  { --k: var(--rc-info); }
      .chip.light { --k: var(--rc-light); }
      .chip.plug  { --k: var(--rc-plug); }
      button.chip { cursor: pointer; transition: background .2s; }
      button.chip:hover { background: color-mix(in srgb, var(--k) 26%, transparent); }
      button.chip:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
      button.chip .off { --mdc-icon-size: 11px; margin-left: 2px; opacity: .75; }
      /* A 32 px tall touch target around the 20 px header chips, without changing how they look. */
      .head button.chip { position: relative; }
      .head button.chip::before { content: ""; position: absolute; inset: -6px -3px; }
      /* Narrow card: the header keeps the title readable (the power icons go, the chips stay tappable). */
      @container (max-width: 340px) {
        .head { gap: 6px; }
        .head button.chip .off { display: none; }
      }

      .confirm[hidden] { display: none; }
      ha-card:has(> .confirm:not([hidden])) { min-height: 220px; }
      .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
                  padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
      .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
               box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4);
               display: flex; flex-direction: column; gap: 10px; }
      .modal h3 { margin: 0; font-size: 16px; font-weight: 500; }
      .modal .hint { font-size: 13px; color: var(--secondary-text-color); }
      .modal-list { display: flex; flex-direction: column; gap: 4px; overflow: auto; min-height: 0; }
      .modal-item { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
      .modal-item span:first-child { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .modal-item span:last-child { flex: none; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
      .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2px; }
      .modal button.act { border: 0; border-radius: 8px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer; }
      .modal button.cancel { background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); }
      .modal button.cancel:hover { background: color-mix(in srgb, var(--primary-text-color) 10%, var(--secondary-background-color, transparent)); }
      .modal button.primary { background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent); color: var(--primary-color, #03a9f4); }
      .modal button.primary:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent); }
      .modal button.act:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

      .grid { display: grid; grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
      @container (max-width: 340px) { .grid:not(.fixed) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

      .room { --t: var(--rc-idle); all: unset; box-sizing: border-box; cursor: pointer; min-width: 0;
              display: grid; grid-template-columns: 26px minmax(0, 1fr); grid-template-areas: "ic name" "ic state" "chips chips";
              column-gap: 7px; row-gap: 0; align-items: center; align-content: start; padding: 6px 7px; border-radius: 10px;
              background: var(--secondary-background-color, transparent); border: 1px solid transparent;
              transition: background .2s, border-color .2s; }
      .room.lvl-warn  { --t: var(--rc-warn); }
      .room.lvl-alert { --t: var(--rc-alert); }
      .room.lvl-info  { --t: var(--rc-info); }
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
      .room.lvl-alert .ic { animation: rc-blink 1.5s ease-in-out infinite; }
      .name { grid-area: name; font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .state { grid-area: state; font-size: 11px; line-height: 1.2; color: var(--secondary-text-color);
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .room:not(.lvl-ok) .state { color: var(--t); }
      .chips { grid-area: chips; display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
      .chips:empty { display: none; }
      .grid[hidden] { display: none; }
      .empty { grid-column: 1 / -1; padding: 12px; text-align: center; font-size: 13px; color: var(--secondary-text-color); }

      .panel { margin-top: 8px; border-radius: 12px; overflow: hidden;
               background: var(--secondary-background-color, transparent);
               --ha-card-background: transparent; --card-background-color: transparent;
               --ha-card-box-shadow: none; --ha-card-border-width: 0; }
      .panel[hidden] { display: none; }
      .panel > * + * { border-top: 1px solid var(--divider-color, rgba(127,127,127,.15)); }
      .list { display: flex; flex-direction: column; padding: 4px; }
      .row { all: unset; cursor: pointer; display: flex; justify-content: space-between; gap: 8px; padding: 6px 8px; border-radius: 8px;
             font-size: 13px; color: var(--primary-text-color); }
      .row span:last-child { color: var(--secondary-text-color); font-size: 12px; }
      .row.on span:last-child { color: var(--rc-warn); }
      .row:hover { background: color-mix(in srgb, var(--rc-idle) 12%, transparent); }

      @media (prefers-reduced-motion: reduce) { .room, .room .ic { animation: none; transition: none; } }
    `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
// Entities the card counts in the rooms it shows, plus the ones already excluded.
const roExcludeField = (hass, config) => {
  if (!hass) return [];
  const rooms = rcProbe(RoomOverviewCard, hass, { ...config, exclude: [], zoom: false })._collect();
  const ids = rooms.flatMap((x) => [...x.sensors, ...x.presence, ...x.lights, ...x.plugs].map((e) => e.id));
  for (const id of config?.exclude || []) if (!ids.includes(id)) ids.push(id);
  return rcEntitiesField("exclude", ids);
};

const RoomOverviewCardEditor = rcEditor({
  card: RoomOverviewCard,
  helpers: ["title", "columns", "presence", "zoom", "all_off_button", "plugs_off_button", "exclude", ...RC_ADVANCED_HELPERS],
  schema: (lang, hass, config) => [
    ...rcOverviewFields(RO_I18N, lang),
    { name: "presence", selector: { boolean: {} } },
    { name: "zoom", selector: { boolean: {} } },
    { name: "all_off_button", selector: { boolean: {} } },
    { name: "plugs_off_button", selector: { boolean: {} } },
    {
      name: "exclude_areas",
      // The rooms the card finds, excluded ones included.
      selector: {
        select: {
          multiple: true,
          mode: "dropdown",
          options: hass
            ? rcProbe(RoomOverviewCard, hass, { ...config, exclude_areas: [], zoom: false })
                ._collect()
                .map((x) => ({ value: x.id, label: x.name }))
            : [],
        },
      },
    },
    ...roExcludeField(hass, config),
    ...rcAdvanced(RO_I18N, lang, "rooms", "language"),
  ],
});

rcRegister(
  RoomOverviewCard,
  RoomOverviewCardEditor,
  "Room Overview Card",
  "Every room at a glance: openings, leaks, presence, lights and plugs; tap a room for its details",
);

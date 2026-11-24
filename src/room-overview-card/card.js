// ── Card ─────────────────────────────────────────────────────────────────────
import { RO_CLOSED_GUARD_MS } from "./i18n-helpers.js";
import { RO_I18N } from "./i18n/ro-i18n.js";

export class RoomOverviewCard extends rcRoomsPanel(RcCard) {
  static tag = "room-overview-card";
  static sceneTheme = "overview";
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
    // Escape closes the confirmation popup (as Cancel), wherever the focus is.
    this._onKey = (ev) => {
      if (ev.key !== "Escape" || !this._confirm) return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  set hass(hass) {
    super.hass = hass;
    for (const el of this._details || []) el.hass = hass;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
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

    const power = rcPowerSensors(h);
    const watts = (id) => rcWattsOf(h, power[reg[id]?.device_id]);

    const overrides = Object.fromEntries((c.rooms || []).map((x) => [x.area, x]));
    const outdoor = (aid) => overrides[aid]?.outdoor ?? rcIsOutdoor(h.areas?.[aid]);

    const rooms = {};
    const room = (aid) => {
      if (!rooms[aid]) {
        rooms[aid] = { id: aid, outdoor: outdoor(aid), sensors: [], presence: [], lights: [], plugs: [] };
      }
      return rooms[aid];
    };

    // The room cards' own rules, so that a room counts what its unfolded details show. An entity listed in a room's
    // `include` counts in that room only.
    const included = rcRoomIncludes(h, c);
    this._included = included;
    for (const [id, aid] of rcByArea(this, (id) => /^(binary_sensor|light|switch)\./.test(id))) {
      const st = h.states[id];
      if (!st || included.has(id)) continue;
      const dc = st.attributes.device_class;
      if (rcMatchSensor(h, id, { presence: c.presence, outdoor: outdoor(aid) })) {
        if (RC_OPENING_CLASSES.includes(dc)) room(aid).sensors.push({ id, st });
        else room(aid).presence.push({ id, st });
      } else if (rcMatchLight(h, id)) {
        room(aid).lights.push({ id, st });
      } else if (rcMatchPlug(h, id)) {
        room(aid).plugs.push({ id, st, watts: watts(id) });
      }
    }
    // `rooms[].include`, sorted by domain whatever its device class: a binary sensor is an opening unless it is a
    // presence one, a switch a light when named as one and a plug otherwise; other domains are left out.
    for (const [id, { aid }] of included) {
      const st = h.states[id];
      const domain = id.split(".")[0];
      if (domain === "binary_sensor") {
        if (!RC_PRESENCE_CLASSES.includes(st.attributes.device_class)) room(aid).sensors.push({ id, st });
        else if (c.presence !== false) room(aid).presence.push({ id, st });
      } else if (domain === "light" || (domain === "switch" && rcMatchLight(h, id))) {
        room(aid).lights.push({ id, st });
      } else if (domain === "switch") {
        room(aid).plugs.push({ id, st, watts: watts(id) });
      }
    }

    const exclude = new Set(c.exclude_areas || []);

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
          open: x.sensors.filter(on).length,
          // An opening sensor that cannot report is no all-clear: the room needs a look.
          unavail: x.sensors.filter((s) => rcUnavailable(s.st)).length,
          occupied: x.presence.some(on),
          lightsOn: x.lights.filter(on).length,
          plugsOn: plugsOn.length,
          watts: plugWatts.length ? plugWatts.reduce((t, p) => t + p.watts, 0) : null,
        };
      });

    const rank = (x) => (x.open ? 4 : x.unavail ? 3 : x.occupied ? 2 : x.lightsOn || x.plugsOn ? 1 : 0);
    rcSortRooms(list, c, rank);
    this._total = list.length;
    this._allRooms = list; // the banner's house shows the rooms needing a look, shown or not
    this._anySensors = list.some((x) => x.sensors.length);
    if (rcCompact(this)) list = list.filter((x) => rank(x) > 0 || x.id === this._openArea);
    return list;
  }

  // The banner's cutaway house: its four rooms (bedroom, bathroom, living room, kitchen) stand for the home's rooms
  // needing a look most, each in the room of its own type when there is one, else in a free one.
  _sceneState() {
    const rank = (x) => (x.open || x.unavail ? 4 : x.occupied ? 2 : x.lightsOn ? 1 : 0);
    const rooms = [...(this._allRooms || [])].sort((a, b) => rank(b) - rank(a)).slice(0, 4);
    const kinds = [["bedroom", "kids"], ["bathroom", "toilets"], ["living", "dining", "office"], ["kitchen", "laundry"]];
    const slots = [null, null, null, null];
    const left = [];
    for (const x of rooms) {
      const type = rcGuessRoomType(this._hass.areas?.[x.id]);
      const i = kinds.findIndex((k, j) => !slots[j] && k.includes(type));
      if (i >= 0) slots[i] = x;
      else left.push(x);
    }
    for (const x of left) slots[slots.indexOf(null)] = x;
    return {
      slots: slots.map((x) => x && { warn: x.open > 0 || x.unavail > 0, presence: x.occupied, light: x.lightsOn > 0 }),
    };
  }

  _roomState(x) {
    if (x.open || x.unavail) return { lvl: "warn", text: this._openingStatus(x.open, false, "all_quiet", x.unavail) };
    if (x.occupied) return { lvl: "info", text: this._t("presence") };
    return { lvl: "ok", text: this._openingStatus(0, x.sensors.length > 0) };
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    const c = this._config;
    const rooms = this._collect();
    this._rooms = rooms;

    // The sensor count too: a door added to an idle room turns "All quiet" into "All closed" without any state change.
    const parts = rooms.map((x) => [x.id, x.name, x.icon, x.open, x.occupied, x.lightsOn, x.plugsOn, x.watts && Math.round(x.watts), x.sensors.length, x.unavail]);
    if (!this._changed([this._openArea, this._zoomed, this._anySensors, parts])) return;

    const illus = this._illustrated();
    if (this._shellOnce(RoomOverviewCard.styles, '<div class="panel" hidden></div><div class="grid"></div><div class="confirm" hidden></div>')) {
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

    const open = rooms.reduce((t, x) => t + x.open, 0);
    const unavail = rooms.reduce((t, x) => t + x.unavail, 0);
    const lights = rooms.reduce((t, x) => t + x.lightsOn, 0);
    const plugs = rooms.reduce((t, x) => t + x.plugsOn, 0);
    const watts = rooms.some((x) => x.watts != null) ? rooms.reduce((t, x) => t + (x.watts ?? 0), 0) : null;
    const occupied = rooms.filter((x) => x.occupied).length;
    const level = open || unavail ? "warn" : "ok";
    const status = this._openingStatus(open, this._anySensors, "all_quiet", unavail);
    const headIcon = level === "warn" ? "mdi:home-alert-outline" : "mdi:home-outline";

    const chip = (cls, icon, label, text) =>
      `<span class="chip ${cls}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon>${text ? `<span>${rcEsc(text)}</span>` : ""}</span>`;
    // Header chip that turns everything of its kind off when tapped.
    const offChip = (cls, kind, icon, label, text, offIcon) =>
      `<button class="chip ${cls} action" data-kind="${kind}" title="${rcEsc(label)}"><ha-icon icon="${icon}"></ha-icon><span>${rcEsc(text)}</span><ha-icon class="off" icon="${offIcon}"></ha-icon></button>`;
    const plugText = watts != null ? rcWatts(watts, this._lang()) : String(plugs);

    // The header chips, in one group: on a narrow card it goes to its own line under the title.
    const headChips = [
      occupied ? chip("info", "mdi:account", this._t("rooms_occupied"), String(occupied)) : "",
      lights
        ? c.all_off_button !== false
          ? offChip("light", "lights", "mdi:lightbulb", this._t("turn_lights_off"), String(lights), "mdi:power")
          : chip("light", "mdi:lightbulb", this._t("lights_on"), String(lights))
        : "",
      plugs
        ? c.plugs_off_button
          ? offChip("plug", "plugs", "mdi:power-socket-fr", this._t("turn_plugs_off"), plugText, "mdi:power-plug-off")
          : chip("plug", "mdi:power-socket-fr", this._t("plugs_on"), plugText)
        : "",
    ].join("");

    const card = this.shadowRoot.querySelector("ha-card");
    card.className = `lvl-${level}`;
    const pill = `<div class="pill" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></div>`;
    const hchips = headChips ? `<div class="hchips">${headChips}</div>` : "";
    if (illus) this._updateBanner(card.querySelector(".banner"));
    // In place (see rcMorph): the header keeps its nodes, the pill is fitted again.
    rcMorph(card.querySelector(".head"), illus
      ? `
      <div class="badge"><ha-icon icon="${headIcon}"></ha-icon></div>
      <div class="titles"><div class="trow"><div class="title">${rcEsc(c.title || this._t("title"))}</div>${pill}</div>${hchips}</div>
      ${rcZoomButton(this)}`
      : `
      <div class="badge"><ha-icon icon="${headIcon}"></ha-icon></div>
      <div class="title">${rcEsc(c.title || this._t("title"))}</div>
      ${hchips}
      ${pill}
      ${rcZoomButton(this)}`,
    );
    this._fitPill();

    this._roomGrid(card.querySelector(".grid"), rooms, (x) => {
      const s = this._roomState(x);
      // Chips only add what the state line does not already say.
      const chips = [
        x.occupied && s.lvl !== "info" ? chip("info", "mdi:account", this._t("presence")) : "",
        x.lightsOn ? chip("light", "mdi:lightbulb", this._t("lights_on"), String(x.lightsOn)) : "",
        x.plugsOn
          ? chip("plug", "mdi:power-socket-fr", this._t("plugs_on"), x.watts != null ? rcWatts(x.watts, this._lang()) : String(x.plugsOn))
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

  // Plugs `ids` of room `x` turned off from the room details: listed and confirmed like the header's plugs chip.
  // The room is looked up again: `x` is the one seen when the details were built, its power long out of date.
  _confirmPlugs(ids, x) {
    x = this._rooms?.find((r) => r.id === x.id) ?? x;
    const plugs = ids
      .map((id) => {
        const known = x.plugs.find((e) => e.id === id);
        const st = known?.st ?? this._hass.states[id];
        return st ? { id, st, watts: known?.watts ?? null, room: x.name } : null;
      })
      .filter(Boolean);
    if (plugs.length) this._openConfirm(plugs);
  }

  // In-card confirmation at the top of the card (as in ha-system-monitor-card and ha-roborock-card), drawn once:
  // updates leave it, and the focus in it, alone. OK turns off the plugs listed, nothing else.
  _openConfirm(plugs) {
    this._confirm = plugs;
    const n = plugs.length;
    const items = plugs
      .map((e) => {
        const extra = [e.room, e.watts != null ? rcWatts(e.watts, this._lang()) : ""].filter(Boolean).join(" · ");
        return `<div class="modal-item"><span>${rcEsc(e.st.attributes.friendly_name || e.id)}</span><span>${rcEsc(extra)}</span></div>`;
      })
      .join("");
    const box = this.shadowRoot.querySelector(".confirm");
    box.innerHTML = `
      <div class="backdrop" data-action="backdrop">
        <div class="modal" role="dialog" aria-modal="true" aria-label="${rcEsc(this._t("turn_plugs_off"))}">
          <h3>${rcEsc(this._t("turn_plugs_off"))}</h3>
          <div class="hint">${rcEsc(this._tn("confirm_plugs", n))}</div>
          <div class="modal-list">${items}</div>
          <div class="modal-actions">
            <button type="button" class="act cancel" data-action="cancel">${rcEsc(this._t("cancel"))}</button>
            <button type="button" class="act primary" data-action="ok">${rcEsc(this._t("turn_off"))}</button>
          </div>
        </div>
      </div>`;
    box.hidden = false;
    window.addEventListener("keydown", this._onKey);
    box.querySelector(".primary")?.focus({ preventScroll: true });
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

  // rcRoomsPanel hooks: the tiles shown, the room details dropped on fold, and the confirmation closed by an outside
  // click (as Cancel) before the open room folds back.
  _shownRooms() {
    return this._rooms;
  }

  _clearPanel() {
    this._details = [];
  }

  _beforeFold() {
    if (this._confirm) this._closeConfirm();
  }

  // Details of the open room: its room-sensors, room-lights and room-switch cards (same bundle, always defined; a room
  // only exists with at least one entity, so at least one of them is shown).
  _fillPanel() {
    const x = this._rooms.find((r) => r.id === this._openArea);
    const panel = this.shadowRoot.querySelector(".panel");
    panel.hidden = false;
    const key = JSON.stringify([x.id, x.sensors.length, x.presence.length, x.lights.length, x.plugs.length]);
    if (this._panelArea === key) return;
    this._panelArea = key;
    panel.innerHTML = "";
    this._details = [];

    // Each details card gets the room's `include` items it shows, as the tiles count them.
    const has = (kind) => new Set(x[kind].map((e) => e.id));
    const inc = (...kinds) => {
      const ids = new Set(kinds.flatMap((k) => [...has(k)]));
      const list = rcIncludesOf(this._included || new Map(), x.id, (id) => ids.has(id));
      return list.length ? { include: list } : {};
    };
    const parts = [
      ["room-sensors-card", x.sensors.length + x.presence.length, { title: this._t("sensors"), presence: this._config.presence, outdoor: x.outdoor, ...inc("sensors", "presence") }],
      ["room-lights-card", x.lights.length, { title: this._t("lights"), ...inc("lights") }],
      ["room-switch-card", x.plugs.length, { title: this._t("plugs"), all_off_button: this._config.plugs_off_button === true, ...inc("plugs") }],
    ];
    for (const [tag, count, extra] of parts) {
      if (!count || !customElements.get(tag)) continue;
      const el = document.createElement(tag);
      el.setConfig({
        type: `custom:${tag}`,
        area: x.id,
        exclude: [...(this._config.exclude || []), ...rcIncludedElsewhere(this._included || new Map(), x.id)],
        illustration: false,
        ...(this._config.language ? { language: this._config.language } : {}),
        ...extra,
      });
      // The Plugs card's all-off pill goes through the same confirmation as the header's plugs chip.
      if (tag === "room-switch-card") el._confirmOff = (ids) => this._confirmPlugs(ids, x);
      el.hass = this._hass;
      panel.appendChild(el);
      this._details.push(el);
    }
  }

  static styles = `${RC_ZOOM_STYLES}${RC_ROOM_GRID_STYLES}${RC_CHIP_STYLES}
      ha-card { container-type: inline-size; position: relative; }
      ha-card.lvl-ok    { --c: var(--rc-ok); }
      ha-card.lvl-warn  { --c: var(--rc-warn); }

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

      .room { --t: var(--rc-idle); }
      .room.lvl-warn  { --t: var(--rc-warn); }
      .room.lvl-info  { --t: var(--rc-info); }
      .chips { gap: 3px; margin-top: 4px; }

      .panel > * + * { border-top: 1px solid var(--divider-color, rgba(127,127,127,.15)); }

      @media (prefers-reduced-motion: reduce) { .room .ic { animation: none; } }
    `;
}

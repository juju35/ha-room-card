// ── Card ─────────────────────────────────────────────────────────────────────
import { RL_KEY_MS, RL_PREFIX, RL_SCENE_PREFIX, RL_SUFFIX, rlDimmable } from "./i18n-helpers.js";
import { RL_I18N } from "./i18n/rl-i18n.js";

export class RoomLightsCard extends RcToggleCard {
  static tag = "room-lights-card";
  static i18n = RL_I18N;
  static needsArea = true;
  static includeDomains = ["light", "switch"];
  static headIcons = ["mdi:lightbulb-group", "mdi:lightbulb-group-off-outline"];
  static emptyKey = "no_lights";
  static sceneTheme = "lights";
  static defaults = {
    columns: 2,
    layout: "compact",
    only_on: false,
    hide_when_off: false,
    show_brightness: true,
    all_off_button: true,
    show_scenes: true,
    exclude: [],
  };

  constructor() {
    super();
    // A click anywhere else folds the scenes back.
    this._onScenesOutside = (ev) => {
      if (this._scenesOpen && rcOutside(this, ev)) this._foldScenes();
    };
  }

  connectedCallback() {
    super.connectedCallback?.();
    this._scenesWatch ??= watchOutside(this, this._onScenesOutside);
    this._scenesWatch.on();
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._scenesWatch?.off();
    // Left (another dashboard view, a conditional card hidden): folded again.
    this._scenesOpen = false;
    this._sig = null;
  }

  _foldScenes() {
    this._scenesOpen = false;
    this._sig = null;
    this._render();
  }

  _candidate(id) {
    return rcMatchLight(this._hass, id);
  }

  // The room's scenes: `scenes` when given (IDs or {entity, name, icon}), else the scene entities of the area, and
  // the Philips Hue scenes of the Hue room named like it (they often have no area of their own). None with
  // `show_scenes: false`. Sorted by name.
  _scenes() {
    const h = this._hass;
    const c = this._config;
    if (c.show_scenes === false) return [];
    const areaName = this._areaName();
    const list = c.scenes?.length
      ? c.scenes.map((e) => (typeof e === "string" ? { entity: e } : e)).filter((e) => e?.entity && h.states[e.entity])
      : c.area
        ? Object.keys(h.entities || {})
            .filter((id) => id.startsWith("scene.") && h.states[id] && !h.entities[id].hidden && !(c.exclude || []).includes(id))
            .filter((id) => {
              if (this._areaOf(id) === c.area) return true;
              const group = h.states[id].attributes.group_name;
              return !this._areaOf(id) && h.entities[id].platform === "hue" && !!areaName && String(group || "").toLowerCase() === areaName.toLowerCase();
            })
            .map((entity) => ({ entity }))
        : [];
    return list
      .map((e) => {
        const st = h.states[e.entity];
        const group = st.attributes.group_name;
        let name = e.name ?? rcCleanName(st.attributes.friendly_name || e.entity, areaName, RL_SCENE_PREFIX, /$^/);
        if (!e.name && group && group !== areaName) name = rcCleanName(name, group, /$^/, /$^/);
        return {
          id: e.entity,
          name,
          icon: e.icon ?? h.entities?.[e.entity]?.icon ?? st.attributes.icon ?? "mdi:palette-outline",
          dynamic: h.entities?.[e.entity]?.platform === "hue" && st.attributes.is_dynamic === true,
          unavailable: rcUnavailable(st),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // The scenes and whether their section is open count as something shown: a change redraws the card.
  _changed(parts) {
    this._sceneItems = this._scenes();
    return super._changed([...parts, this._scenesOpen === true, this._sceneItems.map((x) => [x.id, x.name, x.icon, x.dynamic, x.unavailable])]);
  }

  // Under the lights: a "Scenes" section, folded (chevron right) until its title is tapped (chevron down), then one
  // chip per scene. A tap activates it: scene.turn_on, or hue.activate_scene for a dynamic Hue scene (its colours
  // keep moving).
  _afterGrid() {
    const scenes = this._sceneItems || [];
    if (!scenes.length) return "";
    const open = this._scenesOpen === true;
    const chips = open
      ? `<div class="scenes">${scenes
          .map(
            (x) =>
              `<button class="scene${x.unavailable ? " na" : ""}" data-scene="${rcEsc(x.id)}" title="${rcEsc(this._t("activate_scene", { name: x.name }))}"${
                x.unavailable ? " disabled" : ""
              }><ha-icon icon="${rcEsc(x.icon)}"></ha-icon><span>${rcEsc(x.name)}</span></button>`,
          )
          .join("")}</div>`
      : "";
    return `<div class="section">
        <button class="section-title" aria-expanded="${open}"><ha-icon icon="mdi:palette-outline"></ha-icon><span>${rcEsc(
          this._t("scenes"),
        )}</span><span class="count">${scenes.length}</span><ha-icon class="chev" icon="${open ? "mdi:chevron-down" : "mdi:chevron-right"}"></ha-icon></button>
        ${chips}
      </div>`;
  }

  _bindAfter(root) {
    root.querySelector(".section-title")?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this._scenesOpen = !this._scenesOpen;
      this._sig = null;
      this._render();
      // From the keyboard (Enter / Space: no click count), the new title keeps the focus.
      if (ev.detail === 0) this.shadowRoot.querySelector(".section-title")?.focus({ preventScroll: true });
    }, this._on);
    for (const el of root.querySelectorAll(".scene")) el.addEventListener("click", (ev) => this._activateScene(ev, el.dataset.scene), this._on);
  }

  _activateScene(ev, id) {
    ev?.stopPropagation?.();
    const x = (this._sceneItems || []).find((i) => i.id === id);
    if (!x || x.unavailable) return;
    if (x.dynamic) rcCall(this._hass, "hue", "activate_scene", { entity_id: id, dynamic: true });
    else rcCall(this._hass, "scene", "turn_on", { entity_id: id });
  }

  _collect() {
    const h = this._hass;
    const areaName = this._areaName();
    return this._entries()
      .map((e) => {
        const st = h.states[e.entity];
        const unavailable = rcUnavailable(st);
        const on = st.state === "on";
        const pct = on && st.attributes.brightness != null ? Math.round((st.attributes.brightness / 255) * 100) : null;
        const rgb = on ? st.attributes.rgb_color : null;
        const item = {
          id: e.entity,
          on,
          unavailable,
          dimmable: rlDimmable(st),
          pct,
          color: rgb ? `rgb(${rgb.join(",")})` : null,
          name: e.name ?? rcCleanName(st.attributes.friendly_name, areaName, RL_PREFIX, RL_SUFFIX),
          icon:
            e.icon ?? h.entities?.[e.entity]?.icon ?? st.attributes.icon ?? (on ? "mdi:lightbulb" : "mdi:lightbulb-outline"),
        };
        item.state = this._stateText(item);
        return item;
      })
      .sort((a, b) => b.on - a.on || a.name.localeCompare(b.name));
  }

  // The banner's pendant lamps: the first three lights (the ones on first), lit in their own colour.
  _sceneState() {
    return { lamps: (this._items || []).slice(0, 3).map((i) => ({ on: i.on, color: i.color })) };
  }

  _stateText(i) {
    if (i.unavailable) return this._t("unavailable");
    if (!i.on) return this._t("off");
    return i.pct != null ? `${this._t("on")} · ${i.pct} %` : this._t("on");
  }

  _sigOf(i) {
    return [i.id, i.on, i.unavailable, i.pct, i.color, i.name, i.icon];
  }

  _tileOf(i) {
    return this._tile(i, {
      style: i.color ? `--t:${i.color}` : "",
      extra:
        this._config.show_brightness && i.dimmable && i.on
          ? `<span class="bar" style="width:${i.pct ?? 100}%"></span>`
          : "",
      state: rcEsc(i.state),
    });
  }

  // Tap: toggle · hold: more-info · horizontal drag on a dimmable light: brightness (←/→ from the keyboard: ±10 %).
  _bindTile(el, item) {
    const pctAt = (x) => {
      const r = el.getBoundingClientRect();
      return Math.min(100, Math.max(1, Math.round(((x - r.left) / r.width) * 100)));
    };
    const show = (pct) => {
      let bar = el.querySelector(".bar");
      if (!bar) {
        bar = document.createElement("span");
        bar.className = "bar";
        el.prepend(bar);
      }
      bar.style.width = `${pct}%`;
      el.querySelector(".state").textContent = `${this._t("on")} · ${pct} %`;
    };
    // Brightness the keyboard steps from: the light's, until it reports the new one (the tile is then redrawn).
    let level = item?.on ? (item.pct ?? 100) : 0;
    // The keyboard steps show at once; the light gets one call, RL_KEY_MS after the last step (or on the key's release).
    // Updates wait meanwhile, like during a drag, so a redraw does not bring the old level back.
    let pending = null;
    const send = () => {
      if (!pending) return;
      clearTimeout(pending);
      pending = null;
      rcCall(this._hass, "light", "turn_on", { entity_id: item.id, brightness_pct: level });
      this._sig = null;
      this._released(false);
    };
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: item.id }),
      onHold: () => rcMoreInfo(this, item.id),
      drag:
        this._config.show_brightness && item?.dimmable
          ? {
              move: (x) => show(pctAt(x)),
              end: (x) => rcCall(this._hass, "light", "turn_on", { entity_id: item.id, brightness_pct: pctAt(x) }),
              step: (delta) => {
                const pct = Math.min(100, Math.max(1, level + delta));
                if (item.unavailable || pct === level || (!level && delta < 0)) return;
                level = pct;
                show(pct);
                this._pressing = true;
                clearTimeout(pending);
                pending = setTimeout(send, RL_KEY_MS);
              },
              flush: send,
            }
          : null,
    });
  }

  static styles = `
    ha-card.lvl-on  { --c: var(--rc-light); }
    ha-card.lvl-off { --c: var(--rc-idle); }
    .tile { --t: var(--rc-light); }
    .tile.off { --t: var(--rc-idle); }
    .tile.off .ic { background: color-mix(in srgb, var(--t) 12%, transparent); }
    .bar { position: absolute; inset: 0 auto 0 0; pointer-events: none;
           background: color-mix(in srgb, var(--t) 14%, transparent); transition: width .2s; }
    .tile.dragging .bar { transition: none; }
    @media (prefers-reduced-motion: reduce) { .bar { transition: none; } }
    .section { margin-top: 8px; }
    .section-title { all: unset; box-sizing: border-box; width: 100%; display: flex; align-items: center; gap: 6px; cursor: pointer;
                     font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--secondary-text-color);
                     padding: 4px 2px; border-radius: 6px; }
    .section-title:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .section-title ha-icon { --mdc-icon-size: 16px; flex: none; }
    .section-title span:first-of-type { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .section-title .count { font-size: 11px; font-weight: 500; padding: 0 6px; border-radius: 999px;
                            background: color-mix(in srgb, var(--rc-light) 14%, transparent); color: var(--rc-light); }
    .scenes { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
    .scene { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
             padding: 4px 10px 4px 6px; border-radius: 999px; font-size: 12px; font-weight: 500; color: var(--primary-text-color);
             background: color-mix(in srgb, var(--rc-light) 9%, var(--secondary-background-color, transparent));
             border: 1px solid color-mix(in srgb, var(--rc-light) 22%, transparent); }
    .scene span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scene ha-icon { --mdc-icon-size: 16px; color: var(--rc-light); flex: none; }
    .scene:hover { background: color-mix(in srgb, var(--rc-light) 16%, var(--secondary-background-color, transparent)); }
    .scene:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .scene.na { opacity: .6; cursor: default; }
  `;
}

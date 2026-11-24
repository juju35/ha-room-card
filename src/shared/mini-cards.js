// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
import { rcOutside, rcUnzoom, rcZoomClick, rcZoomIcon, watchOutside } from "./overviews.js";
import { rcBindNav, rcEsc, rcMoreInfo } from "./helpers.js";
import { rcMorph } from "./in-place-redraw.js";
import { RC_BASE_STYLES, RC_MINI_STYLES, RC_TOGGLE_MINI_STYLES } from "./common-styles.js";

export const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.hidden ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      const title = rcEsc(c.title || this._areaName() || this._t("title"));
      const navAttrs = `${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}`;
      // Illustrated: the banner (icon, title and status on the wall, the scene at the right), the chips under it.
      // In place, as the full card (see rcMorph and _paint).
      const html = this._illustrated()
        ? `
        <style>${RC_BASE_STYLES}${RC_BANNER_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          ${this._banner(`<div class="head${navAttrs}>
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="titles"><div class="trow"><div class="title">${title}</div>${st}</div></div>
          </div>`)}
          ${chips.trim() ? `<div class="rs">${chips}</div>` : ""}
        </ha-card>`
        : `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${navAttrs}>
                <div class="title">${title}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      rcMorph(this.shadowRoot, html);
      const root = this.shadowRoot;
      const on = this._rewire();
      if (nav) rcBindNav(root.querySelector(".head"), nav, on);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev), on);
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id), on);
      this._fitPill();
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head) return;
      const title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      // Kept from one drawing to the next (data-rc-own: rcMorph leaves it), brought up to date.
      const kept = head.querySelector(":scope > .zoom");
      if (kept) {
        if (kept.title !== title) kept.title = title;
        const icon = kept.querySelector("ha-icon");
        if (icon && icon.getAttribute("icon") !== rcZoomIcon(this)) icon.setAttribute("icon", rcZoomIcon(this));
        return;
      }
      const button = document.createElement("button");
      button.className = "zoom";
      button.setAttribute?.("data-rc-own", "");
      button.title = title;
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

// Lights and plugs mini cards: the status counts what is on out of the total (*2/5 on*), with the full card's
// "turn everything off" button; then a tinted pill (icon and name) for each entity on, its icon alone for the others.
// The subclass may implement `_chipExtra(item)`, shown after the name (a plug's power draw).
export const rcToggleMini = (Base, tag, styles) =>
  class extends rcMini(Base, tag, `${RC_TOGGLE_MINI_STYLES}${styles}`) {
    _chipExtra() {
      return "";
    }

    _drawMini(items) {
      const s = this._summary(items, true);
      if (!s) return;
      const chips = s.shown
        .map((i) => {
          const cls = i.unavailable ? " na" : i.on ? " on pill" : " off";
          const style = i.on && i.color ? ` style="--t:${rcEsc(i.color)}"` : "";
          return `
          <button class="r${cls}" data-id="${rcEsc(i.id)}"${style} title="${rcEsc(i.name)} — ${rcEsc(i.state)}">
            <ha-icon icon="${rcEsc(i.icon)}"></ha-icon>${i.on ? `<span>${rcEsc(i.name)}</span>${this._chipExtra(i)}` : ""}
          </button>`;
        })
        .join("");
      this._paintMini({ level: s.level, icon: s.icon, status: s.status, chips, allOff: s.allOff });
    }
  };

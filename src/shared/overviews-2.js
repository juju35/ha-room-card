// ── Overviews: the open room ─────────────────────────────────────────────────
// What both overviews share around their room tiles: a tap follows the room's `navigation_path` or unfolds its
// details in the `.panel` (filled by the subclass's `_fillPanel`, from `_roomGrid`), a click anywhere else folds it
// back and returns to the rooms needing a look. The subclass implements `_shownRooms()` (the tiles shown) and
// `_clearPanel()` (drops its detail cards); `_beforeFold()` (optional) runs first on an outside click.
import { rcOutside, rcUnzoom, watchOutside } from "./overviews.js";
import { rcNavigate } from "./helpers.js";

export const rcRoomsPanel = (Base) =>
  class extends Base {
    constructor() {
      super();
      this._onOutside = (ev) => {
        if (!rcOutside(this, ev)) return;
        this._beforeFold?.();
        if (this._openArea) this._toggle(null);
        rcUnzoom(this);
      };
    }

    // A new config rebuilds the room details, which take part of it (language, exclude, thresholds…).
    setConfig(config) {
      this._panelArea = null;
      super.setConfig(config);
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._outside ??= watchOutside(this, this._onOutside);
      this._outside.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._outside?.off();
      // Left (another dashboard view, a conditional card hidden): folded back as by a click elsewhere, so that the
      // card does not come back with a room open, zoomed or its popup open.
      this._beforeFold?.();
      if (this._openArea) this._toggle(null);
      rcUnzoom(this);
    }

    _tap(aid) {
      const x = this._shownRooms().find((r) => r.id === aid);
      if (x?.navigation_path) rcNavigate(x.navigation_path);
      else this._toggle(this._openArea === aid ? null : aid);
    }

    // Opens a room's details (the render fills the panel), or folds them back.
    _toggle(aid) {
      this._openArea = aid;
      this._panelArea = null;
      this._sig = null;
      this._render();
      if (aid) return;
      const panel = this.shadowRoot.querySelector(".panel");
      panel.hidden = true;
      panel.innerHTML = "";
      this._clearPanel();
    }
  };
